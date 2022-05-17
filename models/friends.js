const FriendsSchema = new mongoose.Schema({
    requester: { type: ObjectId, ref: 'Users'},
    recipient: { type: ObjectId, ref: 'Users'},
    status: {
      type: Number,
      enums: [
          0,    //'add friend',
          1,    //'requested',
          2,    //'pending',
          3,    //'friends'
      ]
    }
  }, {timestamps: true})


const Friends = mongoose.model('Friends', FriendsSchema)

export default Friends