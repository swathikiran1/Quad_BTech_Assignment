const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "quadbTech.db");
let db = null;

app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

const initializeDBAndServer = async () => {
  try {
    db = await open({ filename: dbPath, driver: sqlite3.Database });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (error) {
    console.log(`Database Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const authenticateToken = (request, response, next) => {
  let jwtToken;
  const authHeader = request.headers["authorization"];
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(" ")[1];
  }

  if (jwtToken === undefined) {
    response.status(401);
    response.send("Invalid JWT Token");
  } else {
    jwt.verify(jwtToken, "teyuewty5254", async (error, payload) => {
      if (error) {
        response.status(401);
        response.send("Invalid JWT Token");
      } else {
        request.userEmail = payload.userEmail;
        request.userId = payload.userId;
        next();
      }
    });
  }
};

const hasAllProperties = (properties) => {
  const { userName, userPassword, userImage, totalOrders } = properties;
  if (
    userName !== undefined &&
    userPassword !== undefined &&
    userImage !== undefined &&
    totalOrders !== undefined
  ) {
    return true;
  }

  return false;
};

const hasUserNameAndUserPasswordAndUserImageProperties = (properties) => {
  const { userName, userPassword, userImage } = properties;
  if (
    userName !== undefined &&
    userPassword !== undefined &&
    userImage !== undefined
  ) {
    return true;
  }

  return false;
};

const hasUserNameAndUserImageAndTotalOrdersProperties = (properties) => {
  const { userName, userImage, totalOrders } = properties;
  if (
    userName !== undefined &&
    userImage !== undefined &&
    totalOrders !== undefined
  ) {
    return true;
  }

  return false;
};

const hasUserNameAndUserPasswordAndTotalOrdersProperties = (properties) => {
  const { userName, userPassword, totalOrders } = properties;
  if (
    userName !== undefined &&
    userPassword !== undefined &&
    totalOrders !== undefined
  ) {
    return true;
  }

  return false;
};

const hasUserPasswordAndUserImageAndTotalOrdersProperties = (properties) => {
  const { userPassword, userImage, totalOrders } = properties;
  if (
    userPassword !== undefined &&
    userImage !== undefined &&
    totalOrders !== undefined
  ) {
    return true;
  }

  return false;
};

const hasUserNameAndUserPasswordProperties = (properties) => {
  const { userName, userPassword } = properties;
  if (userName !== undefined && userPassword !== undefined) {
    return true;
  }

  return false;
};

const hasUserNameAndUserImageProperties = (properties) => {
  const { userName, userImage } = properties;
  if (userName !== undefined && userImage !== undefined) {
    return true;
  }

  return false;
};

const hasUserNameAndTotalOrdersProperties = (properties) => {
  const { userName, totalOrders } = properties;
  if (userName !== undefined && totalOrders !== undefined) {
    return true;
  }

  return false;
};

const hasUserPasswordAndUserImageProperties = (properties) => {
  const { userPassword, userImage } = properties;
  if (userPassword !== undefined && userImage !== undefined) {
    return true;
  }

  return false;
};

const hasUserPasswordAndTotalOrdersProperties = (properties) => {
  const { userPassword, totalOrders } = properties;
  if (userPassword !== undefined && totalOrders !== undefined) {
    return true;
  }

  return false;
};

const hasUserImageAndTotalOrdersProperties = (properties) => {
  const { userImage, totalOrders } = properties;
  if (userImage !== undefined && totalOrders !== undefined) {
    return true;
  }

  return false;
};

// Login User API

app.post("/login/", async (request, response) => {
  const { userEmail, userPassword } = request.body;
  const selectUserQuery = `SELECT * FROM users_table WHERE user_email = '${userEmail}'`;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid User");
  } else {
    const isPasswordMatched = await bcrypt.compare(
      userPassword,
      dbUser.user_password
    );
    if (isPasswordMatched === true) {
      const payload = {
        userEmail: userEmail,
        userId: dbUser.user_id,
      };

      const dateTime = new Date().toJSON().substring(0, 19).replace("T", " ");

      const lastLoginQuery = `UPDATE users_table
                              SET last_logged_in = '${dateTime}'
                              WHERE user_email = '${userEmail}';`;

      await db.run(lastLoginQuery);

      const jwtToken = jwt.sign(payload, "teyuewty5254");
      response.send({ jwtToken });
    } else {
      response.status(400);
      response.send("Invalid Password");
    }
  }
});

// Get User Details

app.get("/", async (request, response, next) => {
  response.send(`
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css" rel="stylesheet" />
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css" rel="stylesheet" />
    <div class="container">
        <h1 class="text-center mt-3 mb-3">QuadB Tech Form</h1>
        <div class="card">
            <div class="card-header">User Details Form</div>
                <div class="card-body">
                    <form method="POST" action="/insert">
                        <div class="mb-3">
                            <label>User Name</label>
                            <input type="text" name="userName" id="user_name" placeholder="Enter User Name" class="form-control" />
                        </div>
                        <div class="mb-3">
                            <label>User Email</label>
                            <input type="email" name="userEmail" id="user_email" placeholder="Enter Email Address" class="form-control" />
                        </div>
                         <div class="mb-3">
                            <label>User Password</label>
                            <input type="password" name="userPassword" id="user_password" placeholder="Enter Password" class="form-control" />
                        </div>
                         <div class="mb-3">
                            <label>User Image</label>
                            <input type="text" name="userImage" id="user_image" placeholder="Enter Image Url" class="form-control" />
                        </div>
                         <div class="mb-3">
                            <label>Total Orders</label>
                            <input type="text" name="totalOrders" id="total_orders" placeholder="Enter Total Orders" class="form-control" />
                        </div>
                        <div class="mb-3">
                            <button type="submit" id="submit_button" class="btn btn-primary">Submit</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
    `);
});

// Get Specific User Details

app.get("/details/:userId/", authenticateToken, async (request, response) => {
  const { userId } = request.params;

  const getUserDetailsQuery = `SELECT * FROM users_table WHERE user_id = '${userId}';`;

  const userDetails = await db.get(getUserDetailsQuery);

  if (userDetails === undefined) {
    response.status(401);

    response.send("Invalid User Id");
  } else {
    response.status(200);

    response.send(userDetails);
  }
});

// Update User Details

app.put("/update/:userId/", authenticateToken, async (request, response) => {
  const { userId } = request.params;
  const { userName, userPassword, userImage, totalOrders } = request.body;
  let updateQuery = "";
  let responseMsg = null;

  const getTheUserDetailsQuery = `SELECT * FROM users_table WHERE user_id = '${userId}';`;

  const userDetails = await db.get(getTheUserDetailsQuery);

  if (userDetails === undefined) {
    response.status(401);

    response.send("Invalid User Id");
  } else {
    switch (true) {
      case hasAllProperties(request.body):
        updateQuery = `
             UPDATE users_table
             SET user_name = '${userName}',
                 user_password = '${userPassword}',
                 user_image = '${userImage}',
                 total_orders = '${totalOrders}'
             WHERE
              user_id = '${userId}';`;

        responseMsg = "Users Details Successfully Updated";
        await db.run(updateQuery);
        response.send(responseMsg);
        break;
      case hasUserNameAndUserPasswordAndUserImageProperties(request.body):
        updateQuery = `
             UPDATE users_table
             SET user_name = '${userName}',
                 user_password = '${userPassword}',
                 user_image = '${userImage}'
             WHERE
              user_id = '${userId}';`;
        responseMsg = "Users Details Successfully Updated";
        await db.run(updateQuery);
        response.send(responseMsg);
        break;
      case hasUserNameAndUserImageAndTotalOrdersProperties(request.body):
        updateQuery = `
             UPDATE users_table
             SET user_name = '${userName}',
                 user_image = '${userImage}'
                 total_orders = '${totalOrders}'
             WHERE
              user_id = '${userId}';`;
        responseMsg = "Users Details Successfully Updated";
        await db.run(updateQuery);
        response.send(responseMsg);
        break;
      case hasUserNameAndUserPasswordAndTotalOrdersProperties(request.body):
        updateQuery = `
             UPDATE users_table
             SET user_name = '${userName}',
                 user_password = '${userPassword}',
                 total_orders = '${totalOrders}'
             WHERE
              user_id = '${userId}';`;
        responseMsg = "Users Details Successfully Updated";
        await db.run(updateQuery);
        response.send(responseMsg);
        break;
      case hasUserPasswordAndUserImageAndTotalOrdersProperties(request.body):
        updateQuery = `
             UPDATE users_table
             SET user_password = '${userPassword}',
                 user_image = '${userImage}',
                 total_orders = '${totalOrders}'
             WHERE
              user_id = '${userId}';`;
        responseMsg = "Users Details Successfully Updated";
        await db.run(updateQuery);
        response.send(responseMsg);
        break;
      case hasUserNameAndUserPasswordProperties(request.body):
        updateQuery = `
             UPDATE users_table
             SET user_name = '${userName}'
                 user_password = '${userPassword}',
             WHERE
              user_id = '${userId}';`;
        responseMsg = "Users Details Successfully Updated";
        await db.run(updateQuery);
        response.send(responseMsg);
        break;
      case hasUserNameAndUserImageProperties(request.body):
        updateQuery = `
             UPDATE users_table
             SET user_name = '${userName}',
                 user_image = '${userImage}',
             WHERE
              user_id = '${userId}';`;

        responseMsg = "Users Details Successfully Updated";
        await db.run(updateQuery);
        response.send(responseMsg);
        break;
      case hasUserNameAndTotalOrdersProperties(request.body):
        updateQuery = `
             UPDATE users_table
             SET user_name = '${userName}',
                 total_orders = '${totalOrders}'
             WHERE
              user_id = '${userId}';`;

        responseMsg = "Users Details Successfully Updated";
        await db.run(updateQuery);
        response.send(responseMsg);
        break;
      case hasUserPasswordAndUserImageProperties(request.body):
        updateQuery = `
             UPDATE users_table
             SET user_password = '${userPassword}',
                 user_image = '${userImage}'
             WHERE
              user_id = '${userId}';`;

        responseMsg = "Users Details Successfully Updated";
        await db.run(updateQuery);
        response.send(responseMsg);
        break;
      case hasUserPasswordAndTotalOrdersProperties(request.body):
        updateQuery = `
             UPDATE users_table
             SET user_password = '${userPassword}',
                 total_orders = '${totalOrders}'
             WHERE
              user_id = '${userId}';`;

        responseMsg = "Users Details Successfully Updated";
        await db.run(updateQuery);
        response.send(responseMsg);
        break;
      case hasUserImageAndTotalOrdersProperties(request.body):
        updateQuery = `
             UPDATE users_table
             SET user_image = '${userImage}',
                 total_orders = '${totalOrders}'
             WHERE
              user_id = '${userId}';`;

        responseMsg = "Users Details Successfully Updated";
        await db.run(updateQuery);
        response.send(responseMsg);
        break;
      case userName !== undefined:
        updateQuery = `
             UPDATE users_table
             SET user_name = '${userName}'
             WHERE
              user_id = '${userId}';`;

        responseMsg = "Users Details Successfully Updated";
        await db.run(updateQuery);
        response.send(responseMsg);
        break;
      case userPassword !== undefined:
        updateQuery = `
             UPDATE users_table
             SET user_password = '${userPassword}'
             WHERE
              user_id = '${userId}';`;

        responseMsg = "Users Details Successfully Updated";
        await db.run(updateQuery);
        response.send(responseMsg);
        break;
      case userImage !== undefined:
        updateQuery = `
             UPDATE users_table
             SET user_image = '${userImage}'
             WHERE
              user_id = '${userId}';`;

        responseMsg = "Users Details Successfully Updated";
        await db.run(updateQuery);
        response.send(responseMsg);
        break;
      case totalOrders !== undefined:
        updateQuery = `
             UPDATE users_table
             SET total_orders = '${totalOrders}'
             WHERE
              user_id = '${userId}';`;

        responseMsg = "Users Details Successfully Updated";
        await db.run(updateQuery);
        response.send(responseMsg);
        break;
      default:
        response.status(400);
        response.send("Invalid User Details");
        break;
    }
  }
});

// Get User's Image

app.get("/image/:userId", authenticateToken, async (request, response) => {
  const { userId } = request.params;

  const getTheUserDetailsQuery = `SELECT * FROM users_table WHERE user_id = '${userId}';`;

  const userDetails = await db.get(getTheUserDetailsQuery);

  if (userDetails === undefined) {
    response.status(401);

    response.send("Invalid User Id");
  } else {
    const getUserImageQuery = `SELECT user_image
                                        FROM
                                            users_table
                                        WHERE
                                            user_id = '${userId}';`;
    const userImage = await db.get(getUserImageQuery);
    response.status(200);

    response.send(userImage);
  }
});

// Create a User Details

app.post("/insert/", async (request, response) => {
  const {
    userName,
    userEmail,
    userPassword,
    userImage,
    totalOrders,
  } = request.body;

  const hashedPassword = await bcrypt.hash(userPassword, 10);

  const dateTime = new Date().toJSON().substring(0, 19).replace("T", " ");

  const getTheUserDetailsQuery = `SELECT * FROM users_table WHERE user_email = '${userEmail}';`;

  const userDetails = await db.get(getTheUserDetailsQuery);

  if (userDetails === undefined) {
    const createUserQuery = `INSERT INTO users_table(user_id,
                                    user_name,
                                    user_email,
                                    user_password,
                                    user_image,
                                    total_orders,
                                    created_at
                                )
                                VALUES('${uuidv4()}','${userName}',
                                '${userEmail}',
                                '${hashedPassword}',
                                '${userImage}',
                                '${totalOrders}', '${dateTime}');`;

    await db.run(createUserQuery);

    const getAllUsersQuery = `SELECT * FROM users_table`;

    const allUsersList = await db.all(getAllUsersQuery);

    response.send(allUsersList);
  } else {
    response.status(400);

    response.send("User Already Exits");
  }
});

// Delete a Specific User Details

app.delete("/delete/:userId/", authenticateToken, async (request, response) => {
  const { userId } = request.params;

  const getTheUserDetailsQuery = `SELECT * FROM users_table WHERE user_id = '${userId}';`;

  const userDetails = await db.get(getTheUserDetailsQuery);

  if (userDetails === undefined) {
    response.status(401);

    response.send("Invalid User Id");
  } else {
    const deleteQuery = `DELETE FROM users_table WHERE user_id = '${userId}';`;

    await db.run(deleteQuery);

    response.status(200);

    response.send("User Details Successfully Deleted");
  }
});

module.exports = app;
