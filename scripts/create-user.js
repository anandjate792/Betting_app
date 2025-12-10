const mongoose = require("mongoose")
const bcryptjs = require("bcryptjs")

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, enum: ["admin", "user"], default: "user" },
  walletBalance: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
})

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next()
  const salt = await bcryptjs.genSalt(10)
  this.password = await bcryptjs.hash(this.password, salt)
  next()
})

const User = mongoose.model("User", userSchema)

async function createUser() {
  const args = process.argv.slice(2)
  const name = args[0]
  const email = args[1]
  const password = args[2]
  const role = args[3] || "user"

  if (!name || !email || !password) {
    console.error("❌ Usage: npm run create:user <name> <email> <password> [role]")
    console.error("📝 Example: npm run create:user 'John Doe' john@example.com password123 user")
    process.exit(1)
  }

  try {
    const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/wallet-app"
    console.log(`🔌 Connecting to MongoDB at ${mongoUri.split("@")[1] || mongoUri}...`)

    await mongoose.connect(mongoUri)
    console.log("✅ Connected to MongoDB\n")

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      console.error(`❌ User with email ${email} already exists`)
      process.exit(1)
    }

    const user = new User({ name, email, password, role })
    await user.save()

    console.log("✅ User created successfully!")
    console.log(`   📛 Name: ${name}`)
    console.log(`   📧 Email: ${email}`)
    console.log(`   👤 Role: ${role}`)
    console.log(`   💰 Wallet Balance: $0\n`)
    console.log("Login with these credentials at http://localhost:3000")

    process.exit(0)
  } catch (error) {
    console.error(`❌ Error creating user: ${error.message}`)
    if (error.message.includes("ECONNREFUSED")) {
      console.error("\n💡 Tip: Make sure MongoDB is running!")
      console.error("   - macOS: brew services start mongodb-community")
      console.error("   - Linux: sudo systemctl start mongod")
    }
    process.exit(1)
  }
}

createUser()
