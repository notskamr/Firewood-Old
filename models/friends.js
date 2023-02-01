const FriendsSchema = new mongoose.Schema({
    requester: { type: ObjectId, ref: 'Users'},
    recipient: { type: ObjectId, ref: 'Users'},
    status: {
      type: String,
      enums: [
          'addFriend',    //'add friend',
          'requested',    //'requested',
          'pending',    //'pending',
          'friends',    //'friends'
      ]
    }
  }, {timestamps: true})


const Friends = mongoose.model('Friends', FriendsSchema)

export default Friends