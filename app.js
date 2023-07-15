const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "twitterClone.db");
let db = null;

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
    jwt.verify(jwtToken, "dgfjsdj", async (error, payload) => {
      if (error) {
        response.status(401);
        response.send("Invalid JWT Token");
      } else {
        request.username = payload.username;
        request.userId = payload.userId;
        next();
      }
    });
  }
};

const getFollowingPeopleIdsOfUser = async (username) => {
  const getFollowingPeopleQuery = `SELECT following_user_id FROM follower
    INNER JOIN user ON user.user_id = follower.follower_user_id
    WHERE user.username = '${username}';`;

  const followingPeople = await db.all(getFollowingPeopleQuery);

  const IdsArray = followingPeople.map(
    (eachItem) => eachItem.following_user_id
  );

  return IdsArray;
};

// Tweet Access Verification

const tweetAccessVerification = async (request, response, next) => {
  const { userId } = request;
  const { tweetId } = request.params;
  const getTweetQuery = `SELECT * FROM tweet
       INNER JOIN follower ON tweet.user_id = follower.following_user_id 
       WHERE tweet_id = ${tweetId} AND follower_user_id = ${userId};`;

  const tweet = await db.get(getTweetQuery);

  if (tweet === undefined) {
    response.status(401);
    response.send("Invalid Request");
  } else {
    next();
  }
};

// Register API

app.post("/register/", async (request, response) => {
  const { username, password, name, gender } = request.body;
  const getUserDetailsQuery = `SELECT * FROM user WHERE username = '${username}';`;
  const dbUser = await db.get(getUserDetailsQuery);

  if (dbUser === undefined) {
    if (password.length > 6) {
      const hashedPassword = await bcrypt.hash(password, 10);
      const postQuery = `INSERT INTO user(name, username, password, gender)
                                VALUES('${name}', '${username}', '${hashedPassword}', '${gender}');`;
      await db.run(postQuery);
      response.send("User created successfully");
    } else {
      response.status(400);
      response.send("Password is too short");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

// Login API

app.post("/login/", async (request, response) => {
  const { username, password } = request.body;
  const getUserDetailsQuery = `SELECT * FROM user WHERE username LIKE '%${username}%';`;
  const dbUser = await db.get(getUserDetailsQuery);

  if (dbUser !== undefined) {
    isPasswordMatched = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatched) {
      const userId = dbUser.user_id;
      const payLoad = { username: username, userId: userId };
      const jwtToken = jwt.sign(payLoad, "dgfjsdj");
      response.send({ jwtToken });
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  } else {
    response.status(400);
    response.send("Invalid user");
  }
});

// Get Latest Tweets API

app.get("/user/tweets/feed/", authenticateToken, async (request, response) => {
  const { username } = request;

  const followingUserIds = await getFollowingPeopleIdsOfUser(username);

  const getTweetsQuery = `SELECT username, tweet, date_time AS dateTime

  FROM user INNER JOIN tweet ON user.user_id = tweet.user_id WHERE user.user_id IN (${followingUserIds}) ORDER BY date_time DESC LIMIT 4;`;
  const userTweets = await db.all(getTweetsQuery);
  response.send(userTweets);
});

// Get Following People Names API

app.get("/user/following/", authenticateToken, async (request, response) => {
  const { username, userId } = request;

  const getFollowingPeopleNamesQuery = `SELECT name FROM follower INNER JOIN user ON user.user_id = follower.following_user_id WHERE follower_user_id = ${userId};`;

  const followingPeopleNames = await db.all(getFollowingPeopleNamesQuery);

  response.send(followingPeopleNames);
});

// Get follower People Names API

app.get("/user/followers/", authenticateToken, async (request, response) => {
  const { username, userId } = request;

  const getFollowersQuery = `SELECT DISTINCT name FROM follower
    INNER JOIN user ON user.user_id = follower.follower_user_id WHERE following_user_id = ${userId};`;

  const followers = await db.all(getFollowersQuery);

  response.send(followers);
});

// Get Tweets By TweetId API

app.get(
  "/tweets/:tweetId/",
  authenticateToken,
  tweetAccessVerification,
  async (request, response) => {
    const { tweetId } = request.params;

    const { username, userId } = request;

    const getTweetQuery = `SELECT tweet,
        (SELECT COUNT() FROM like WHERE like.tweet_id = ${tweetId}) AS likes,
        (SELECT COUNT() FROM reply WHERE reply.tweet_id = ${tweetId}) AS replies,
        date_time AS dateTime FROM tweet WHERE tweet_id = ${tweetId};`;

    const tweet = await db.get(getTweetQuery);

    response.send(tweet);
  }
);

// Get UserNames Liked Tweet API

app.get(
  "/tweets/:tweetId/likes/",
  authenticateToken,
  tweetAccessVerification,
  async (request, response) => {
    const { tweetId } = request.params;

    const { username, userId } = request;

    const getUserNamesWhoLikedQuery = `SELECT username FROM user
      INNER JOIN like ON user.user_id = like.user_id WHERE tweet_id = ${tweetId};`;

    const likedUsers = await db.all(getUserNamesWhoLikedQuery);

    const userNamesArray = likedUsers.map((eachItem) => eachItem.username);

    response.send({ likes: userNamesArray });
  }
);

// Get Replies API

app.get(
  "/tweets/:tweetId/replies/",
  authenticateToken,
  tweetAccessVerification,
  async (request, response) => {
    const { tweetId } = request.params;

    const { username, userId } = request;

    const getRepliesQuery = `SELECT name, reply FROM user
       INNER JOIN reply ON user.user_id = reply.user_id WHERE tweet_id = ${tweetId};`;

    const replies = await db.all(getRepliesQuery);

    response.send({ replies: replies });
  }
);

// Get All Tweets Of User API

app.get("/user/tweets/", authenticateToken, async (request, response) => {
  const { username, userId } = request;

  const getTweetsQuery = `SELECT tweet,
       COUNT(DISTINCT like_id) AS likes,
       COUNT(DISTINCT reply_id) AS replies,
       date_time AS dateTime FROM tweet LEFT JOIN reply ON tweet.tweet_id = reply.tweet_id LEFT JOIN like ON tweet.tweet_id = like.tweet_id 
       WHERE tweet.user_id = ${userId}
       GROUP BY tweet.tweet_id`;

  const tweets = await db.all(getTweetsQuery);

  response.send(tweets);
});

// Post Tweet API

app.post("/user/tweets/", authenticateToken, async (request, response) => {
  const { tweet } = request.body;
  const userId = parseInt(request.userId);
  const dateTime = new Date().toJSON().substring(0, 19).replace("T", " ");

  const createTweetQuery = `INSERT INTO tweet(tweet, user_id, date_time)
        VALUES('${tweet}', ${userId}, '${dateTime}');`;

  await db.run(createTweetQuery);

  response.send("Created a Tweet");
});

// Delete Tweet API

app.delete(
  "/tweets/:tweetId/",
  authenticateToken,
  async (request, response) => {
    const { tweetId } = request.params;

    const { userId } = request;

    const getTheTweetQuery = `SELECT * FROM tweet WHERE tweet_id = ${tweetId} AND user_id = ${userId};`;

    const tweet = await db.get(getTheTweetQuery);

    if (tweet === undefined) {
      response.status(401);
      response.send("Invalid Request");
    } else {
      const deleteTweetQuery = `DELETE FROM tweet WHERE tweet_id = ${tweetId};`;

      await db.run(deleteTweetQuery);

      response.send("Tweet Removed");
    }
  }
);
module.exports = app;
