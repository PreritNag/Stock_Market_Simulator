const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_51P2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

/**
 * @desc    Create a Stripe Checkout Session for ₹1 (100 paise)
 * @route   POST /api/payment/create-order
 */
const createOrder = async (req, res) => {
  try {
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    
    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'inr',
            product_data: {
              name: 'BullForge Wallet Top-up (₹5,000 Virtual Credit)',
              description: 'Top-up your virtual trading balance. Real money is used for verification only.',
            },
            unit_amount: 100, // ₹1.00 INR (100 paise)
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${clientUrl}/wallet?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${clientUrl}/wallet?payment=cancel`,
      metadata: {
        userId: req.user._id.toString(),
      },
    });

    // Create a pending transaction record
    await Transaction.create({
      userId: req.user._id,
      type: 'DEPOSIT',
      amount: 5000, // Credits ₹5000 virtual balance upon success
      description: 'Stripe virtual balance top-up',
      stripeSessionId: session.id,
      status: 'PENDING'
    });

    console.log(`Stripe session created: ${session.id} for user ${req.user._id}`);

    res.json({
      success: true,
      url: session.url,
      session_id: session.id
    });
  } catch (error) {
    console.error('Create stripe session error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error creating Stripe Checkout Session'
    });
  }
};

/**
 * @desc    Verify Stripe session payment and credit ₹5000 virtual balance
 * @route   POST /api/payment/verify
 */
const verifyPayment = async (req, res) => {
  try {
    const { session_id } = req.body;

    if (!session_id) {
      return res.status(400).json({
        success: false,
        message: 'Missing session_id'
      });
    }

    // Check if transaction is already completed to avoid double crediting
    let transaction = await Transaction.findOne({ stripeSessionId: session_id });
    if (transaction && transaction.status === 'COMPLETED') {
      const user = await User.findById(req.user._id);
      return res.json({
        success: true,
        message: 'Payment already verified.',
        virtualBalance: user.virtualBalance
      });
    }

    // Retrieve session from Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id);
    
    if (session.payment_status === 'paid') {
      const userId = session.metadata.userId;
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Credit ₹5000
      user.virtualBalance += 5000;
      await user.save();

      // Update or create Transaction
      if (transaction) {
        transaction.status = 'COMPLETED';
        transaction.stripePaymentIntentId = session.payment_intent;
        await transaction.save();
      } else {
        await Transaction.create({
          userId: user._id,
          type: 'DEPOSIT',
          amount: 5000,
          description: 'Stripe virtual balance top-up',
          stripeSessionId: session_id,
          stripePaymentIntentId: session.payment_intent,
          status: 'COMPLETED'
        });
      }

      console.log(`Stripe payment verified: ${session_id}. Credited ₹5000 to user ${userId}. New balance: ₹${user.virtualBalance}`);

      return res.json({
        success: true,
        message: 'Stripe payment verified successfully. ₹5000 added to your virtual balance.',
        virtualBalance: user.virtualBalance
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Stripe payment is not completed yet.'
      });
    }
  } catch (error) {
    console.error('VerifyPayment error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error verifying payment'
    });
  }
};

/**
 * @desc    Stripe webhook endpoint
 * @route   POST /api/payment/webhook
 */
const webhook = async (req, res) => {
  let event = req.body;
  
  // Verify signature only if secret is set
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (sig && webhookSecret && req.rawBody) {
    try {
      event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
  }

  // Handle successful checkout session completed
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId = session.metadata?.userId;
    const sessionId = session.id;

    if (userId) {
      try {
        const user = await User.findById(userId);
        if (user) {
          let transaction = await Transaction.findOne({ stripeSessionId: sessionId });
          if (!transaction || transaction.status !== 'COMPLETED') {
            user.virtualBalance += 5000;
            await user.save();

            if (transaction) {
              transaction.status = 'COMPLETED';
              transaction.stripePaymentIntentId = session.payment_intent;
              await transaction.save();
            } else {
              await Transaction.create({
                userId: user._id,
                type: 'DEPOSIT',
                amount: 5000,
                description: 'Stripe virtual balance top-up (webhook)',
                stripeSessionId: sessionId,
                stripePaymentIntentId: session.payment_intent,
                status: 'COMPLETED'
              });
            }
            console.log(`Webhook: Credited ₹5000 to user ${userId} via Stripe Session ${sessionId}. New balance: ₹${user.virtualBalance}`);
          }
        }
      } catch (err) {
        console.error('Webhook database processing error:', err.message);
      }
    }
  }

  res.json({ received: true });
};

module.exports = { createOrder, verifyPayment, webhook };
