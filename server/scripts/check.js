const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
mongoose.connect('mongodb+srv://botmale01o_db_user:WgbMNFe2SfH8EEJw@cluster0.4cxnszg.mongodb.net/smartplacement?retryWrites=true&w=majority')
.then(async () => {
    const user = await mongoose.connection.db.collection('users').findOne({ email: 'cseplacement7@gmail.com' });
    const isMatch = await bcrypt.compare('admin123', user.password);
    console.log('Password Match:', isMatch);
    process.exit();
}).catch(console.error);
