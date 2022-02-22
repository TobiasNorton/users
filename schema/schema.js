const graphql = require('graphql');
const { GraphQLObjectType, GraphQLString, GraphQLInt, GraphQLSchema, GraphQLList } = graphql;
const axios = require('axios');

const CompanyType = new GraphQLObjectType({
  name: 'Company', // capitalized by convention
  // We are trying to access UserType before it's initialized, which throws an error.
  //  Due to JS hoisting limitations we have to wrap the fields property in an arrow
  //  function. With the way JS closures work, the function will define but not
  //  execute until after this entire file has been executed
  fields: () => ({
    id: { type: GraphQLString },
    name: { type: GraphQLString },
    description: { type: GraphQLString },
    users: {
      // GraphQLList tells GraphQL that we should expect multiple users
      // We don't need any args here because we're not looking for users
      //  that meet any particular criteria
      type: new GraphQLList(UserType),
      // parentValue is a reference to the current company we're working with
      resolve(parentValue, args) {
        return axios
          .get(`http://localhost:3000/companies/${parentValue.id}/users`)
          .then((response) => response.data);
      },
    },
  }),
});

// This object instructs GraphQL on what a User object looks like
// name and fields are required properties. name will always be a string that
//  describes the type we are defining
// fields lets GraphQL know what properties the User object will have
const UserType = new GraphQLObjectType({
  name: 'User',
  fields: {
    id: { type: GraphQLString },
    firstName: { type: GraphQLString },
    age: { type: GraphQLInt },
    company: {
      type: CompanyType,
      resolve(parentValue, args) {
        return axios
          .get(`http://localhost:3000/companies/${parentValue.companyId}`)
          .then((response) => response.data);
      },
    },
  },
});

// RootQuery is used to allow us entry into our applications GraphQL data graph
// The following means "If you give me the id of the user you're looking for,
//  I'll return a user back to you"
// The resolve function's purpose is to actually go out and grab the data, the most important part
// parentValue is notorious for not really ever being used
// The second argument > args in the resolve() function... If our query expects to be
//  provided with an id (see in the args property) that id will be provided
//  in the args argument
const RootQuery = new GraphQLObjectType({
  name: 'RootQueryType',
  fields: {
    user: {
      type: UserType,
      args: { id: { type: GraphQLString } },
      resolve(parentValue, args) {
        return axios
          .get(`http://localhost:3000/users/${args.id}`)
          .then((response) => response.data);
      },
    },
    company: {
      type: CompanyType,
      args: { id: { type: GraphQLString } },
      resolve(parentValue, args) {
        return axios
          .get(`http://localhost:3000/companies/${args.id}`)
          .then((response) => response.data);
      },
    },
  },
});

// GraphQLSchema takes in a RootQuery and returns a GraphQL schema instance
module.exports = new GraphQLSchema({
  query: RootQuery,
});
