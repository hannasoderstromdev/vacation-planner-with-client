const graphql = require('graphql')
const {
  GraphQLBoolean,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
} = graphql
const mongoose = require('mongoose')
const User = mongoose.model('users')
const Vacation = mongoose.model('vacations')

const UserType = new GraphQLObjectType({
  name: 'User',
  fields: {
    id: { type: GraphQLString },
    googleId: { type: GraphQLString },
    email: { type: GraphQLString },
    firstName: { type: GraphQLString },
    lastName: { type: GraphQLString },
    active: { type: GraphQLBoolean },
  },
})

const VacationType = new GraphQLObjectType({
  name: 'Vacation',
  fields: {
    id: { type: GraphQLString },
    author: {
      type: UserType,
      async resolve(parentValue, args) {
        const user = await User.findOne({
          _id: parentValue.author,
        })
        if (user) return user
        return
      },
    },
    arrival: { type: GraphQLString },
    departure: { type: GraphQLString },
    people: { type: new GraphQLList(GraphQLString) },
    created: { type: GraphQLString },
  },
})

const RootQuery = new GraphQLObjectType({
  name: 'RootQueryType',
  fields: {
    user: {
      type: UserType,
      args: { id: { type: GraphQLString } },
      async resolve(parentValue, args) {
        const user = await User.findOne({
          _id: args.id,
        })
        if (user) return user
        throw new Error('No user found', args.id)
      },
    },
    vacation: {
      type: VacationType,
      args: { id: { type: GraphQLString } },
      async resolve(parentValue, args) {
        const vacation = await Vacation.findOne({
          _id: args.id,
        })
        if (vacation) return vacation
        throw new Error('No vacation found', args.id)
      },
    },
    vacations: {
      type: new GraphQLList(VacationType),
      args: {},
      async resolve(parentValue, args) {
        const vacations = await Vacation.find()
        if (vacations) return vacations
        throw new Error('No vacations found')
      },
    },
  },
})

const mutation = new GraphQLObjectType({
  name: 'Mutation',
  fields: {
    addUser: {
      type: UserType,
      args: {
        email: { type: new GraphQLNonNull(GraphQLString) },
        firstName: { type: GraphQLString },
        lastName: { type: GraphQLString },
        password: { type: new GraphQLNonNull(GraphQLString) },
      },
      async resolve(parentValue, { email, firstName, lastName, password }) {
        const user = await User.register(
          {
            email: email,
            firstName: firstName,
            lastName: lastName,
            active: false,
          },
          password
        )
        if (user) return user
        throw new Error('User could not be added', {
          email,
          firstName,
          lastName,
          password,
        })
      },
    },
    deleteUser: {
      type: UserType,
      args: {
        id: { type: new GraphQLNonNull(GraphQLString) },
      },
      async resolve(parentValue, { id }) {
        const user = await User.findOneAndRemove({ _id: id })
        if (user) return user
        throw new Error('User could not be deleted', id)
      },
    },
    editUser: {
      type: UserType,
      args: {
        id: { type: new GraphQLNonNull(GraphQLString) },
        firstName: { type: GraphQLString },
        lastName: { type: GraphQLString },
      },
      async resolve(parentValue, { id, firstName, lastName }) {
        const user = await User.findOneAndUpdate(
          { _id: id },
          {
            firstName,
            lastName,
          },
          { new: true, runValidators: true }
        ).exec()

        if (user) return user
        throw new Error('User could not be updated', id)
      },
    },
    addVacation: {
      type: VacationType,
      args: {
        author: { type: new GraphQLNonNull(GraphQLString) },
        arrival: { type: new GraphQLNonNull(GraphQLString) },
        departure: { type: new GraphQLNonNull(GraphQLString) },
        people: { type: new GraphQLNonNull(new GraphQLList(GraphQLString)) },
      },
      async resolve(parentValue, { author, arrival, departure, people}) {
        const now = new Date()

        const vacation = new Vacation({
          author,
          arrival,
          departure,
          people,
          created: now.toISOString()
        })
        await vacation.save()
        if (vacation) return vacation 
        throw new Error('Could not add Vacation', { author, arrival, departure, people })
      }
    },
  },
})

module.exports = new GraphQLSchema({
  query: RootQuery,
  mutation,
})
