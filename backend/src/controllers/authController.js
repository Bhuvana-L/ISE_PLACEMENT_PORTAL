const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AllowedStudent = require('../models/AllowedStudent');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

exports.register = async (req, res) => {
  try {
    const { name, email, password, usn, department, batch } = req.body;

    if (!usn) return res.status(400).json({ message: 'USN is required' });

    // Check if USN is in the allowed list
    const allowed = await AllowedStudent.findOne({ usn: usn.toUpperCase() });
    if (!allowed) {
      return res.status(403).json({ message: 'Your USN is not in the approved list. Contact your coordinator.' });
    }

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already registered' });

    const usnExists = await User.findOne({ usn: usn.toUpperCase() });
    if (usnExists) return res.status(400).json({ message: 'USN already registered' });

    const user = await User.create({
      name,
      email,
      password,
      role: 'student',
      usn: usn.toUpperCase(),
      department: department || 'ISE',
      batch: allowed.batch,
    });

    // Mark as registered
    allowed.registered = true;
    await allowed.save();

    const token = signToken(user._id);
    res.status(201).json({ token, user: user.toSafeObject() });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password required' });

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ message: 'Invalid credentials' });

    const token = signToken(user._id);
    res.json({ token, user: user.toSafeObject() });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getMe = async (req, res) => {
  res.json({ user: req.user.toSafeObject() });
};

exports.createAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const admin = await User.create({ name, email, password, role: 'admin' });
    const token = signToken(admin._id);
    res.status(201).json({ token, user: admin.toSafeObject() });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) {
      return res.status(400).json({ message: 'Email and new password are required' });
    }

    // Check OTP was verified
    const stored = global.otpStore?.[email.toLowerCase()];
    if (!stored || !stored.verified) {
      return res.status(403).json({ message: 'OTP not verified. Please verify OTP first.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'No account found with that email' });
    }

    user.password = newPassword;
    await user.save();

    // Clean up OTP
    delete global.otpStore[email.toLowerCase()];

    res.json({ message: 'Password reset successfully. You can now login.' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.sendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ message: 'No account found with that email' });

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP in memory
    if (!global.otpStore) global.otpStore = {};
    global.otpStore[email.toLowerCase()] = { otp, expiry };

    // Send email via Brevo API
    const https = require('https');
    const postData = JSON.stringify({
      sender: { name: 'ISE Placement Portal', email: process.env.BREVO_SENDER },
      to: [{ email: email }],
      subject: 'Password Reset OTP - ISE Placement Portal',
      htmlContent: `
        <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #4F46E5;">Password Reset</h2>
          <p>Your OTP for password reset is:</p>
          <div style="background: #F3F4F6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1F2937;">${otp}</span>
          </div>
          <p style="color: #6B7280; font-size: 14px;">This OTP is valid for 10 minutes. Do not share it with anyone.</p>
        </div>
      `,
    });

    const options = {
      hostname: 'api.brevo.com',
      path: '/v3/smtp/email',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY,
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    await new Promise((resolve, reject) => {
      const request = https.request(options, (response) => {
        let data = '';
        response.on('data', (chunk) => { data += chunk; });
        response.on('end', () => {
          if (response.statusCode >= 200 && response.statusCode < 300) resolve(data);
          else reject(new Error(`Brevo API error: ${response.statusCode} - ${data}`));
        });
      });
      request.on('error', reject);
      request.write(postData);
      request.end();
    });

    res.json({ message: 'OTP sent to your email' });
  } catch (err) {
    console.error('Email error:', err.message);
    res.status(500).json({ message: 'Failed to send OTP. Please try again.' });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required' });

    const stored = global.otpStore?.[email.toLowerCase()];
    if (!stored) return res.status(400).json({ message: 'No OTP found. Request a new one.' });
    if (new Date() > stored.expiry) {
      delete global.otpStore[email.toLowerCase()];
      return res.status(400).json({ message: 'OTP expired. Request a new one.' });
    }
    if (stored.otp !== otp) return res.status(400).json({ message: 'Invalid OTP' });

    // Mark as verified
    stored.verified = true;
    res.json({ message: 'OTP verified successfully' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.changeCredentials = async (req, res) => {
  try {
    const { currentPassword, newEmail, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    if (!await user.comparePassword(currentPassword)) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    if (newEmail && newEmail !== user.email) {
      const existing = await User.findOne({ email: newEmail.toLowerCase() });
      if (existing) return res.status(400).json({ message: 'Email already in use' });
      user.email = newEmail;
    }

    if (newPassword) {
      user.password = newPassword;
    }

    await user.save();
    const token = signToken(user._id);
    res.json({ message: 'Credentials updated successfully', token, user: user.toSafeObject() });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
