import mongoose from 'mongoose';
import passportLocalMongoose from 'passport-local-mongoose';


const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  username: {
    type: String,
    required: true
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true
  }
});

const plugin = (passportLocalMongoose).default ?? passportLocalMongoose;
UserSchema.plugin(plugin ,{ usernameField: 'email' });

const User = mongoose.model('User', UserSchema);

export default User;