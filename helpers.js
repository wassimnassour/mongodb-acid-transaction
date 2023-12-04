const { MongoClient } = require("mongodb")

function connectToDatabase() {
  /**
   * Connection URI. Update <username>, <password>, and <your-cluster-url> to reflect your cluster.
   * See http://bit.ly/NodeDocs_lauren for more details
   */
  //   const uri = "mongodb+srv://%username%:%password%@cluster0.zbfq47n.mongodb.net"
  const uri = "mongodb+srv://wassim:wassim@cluster0.zbfq47n.mongodb.net"

  /**
   * The Mongo Client you will use to interact with your database
   * See bit.ly/Node_MongoClient for more details
   */
  const client = new MongoClient(uri)

  return client
}

module.exports = { connectToDatabase }
