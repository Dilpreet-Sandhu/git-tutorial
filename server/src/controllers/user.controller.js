import { ApiError, ApiResponse, cookieOptions } from "../utils/apiHanlder.js";
import { User } from "../models/user.model.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import { Chat } from "../models/chat.model.js";
import { Request } from "../models/request.model.js";
import { emitEvent } from "../utils/features.js";
import { NEW_REQUEST, REFETCH_CHATS } from "../constants/constants.js";

export const registerUser = async (req, res) => {
  try {
    const { name, email, password, bio } = req.body;

    if ([name, email, password].some((item) => item == "")) {
      throw new ApiError(400, "name, email and password are required");
    }
    const avatarPath = req.file.path;

    const avatar = await uploadToCloudinary(avatarPath);

    if (!avatar) {
      throw new ApiError(400, "couldn't upload to cloudinary");
    }

    const user = await User.create({
      name,
      email,
      avatar: avatar.url,
      password,
      bio,
    });

    if (!user) {
      throw new ApiError(400, "couldn't generate user");
    }

    res
      .status(200)
      .json(new ApiResponse(201, user, "user created successfully"));
  } catch (error) {
    console.log(error);
  }
};

const generateTokens = async (id) => {
  const user = await User.findById(id);
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  if (!accessToken || !refreshToken) {
    throw new ApiError(400, "couldn't generate access or refresh token");
  }

  return { accessToken, refreshToken };
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email && !password) {
    throw new ApiError(400, "email and password are required");
  }

  const user = await User.findOne({ email: email });

  // const isPasswordCorrect = await user.isPasswordCorrect(password);



  // if (!isPasswordCorrect) {
  //   throw new ApiError(400, "wrong password");
  // }

  if (!user) {
    throw new ApiError(400, "no user found with this email");
  }

  const { accessToken, refreshToken } = await generateTokens(user._id);

  const newUser = await User.findById(user._id).select("-password");
  newUser.refreshToken = refreshToken;
  await newUser.save({ validateBeforeSave: false });

  return res
    .status(200)
    .cookie("accessToken", accessToken)
    .cookie("refreshToken", refreshToken)
    .json(new ApiResponse(200, newUser, "user logged in successfully"));
};

export const logoutUser = async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $unset: {
        refreshToken: "",
      },
    },
    {
      new: true,
    }
  );

  if (!user) {
    throw new ApiError(401, "you are not logged in");
  }

  res
    .status(200)
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .json(new ApiResponse(200, {}, "user logged out successfully"));
};

export const getUserByName = async (req, res) => {
  const { name } = req.query;
  const user = req.user;

  if (!name) throw new ApiError(400, "no name detected");

  const chats = await Chat.find({ groupChat: false, members: user?._id });

  if (!chats) {
    throw new ApiError(400, "no chats found ");
  }

  const allUsersFromTheChat = chats.flatMap((chat) => chat.members);

  const allUsersExceptMeAndFriends = await User.find({
    _id: { $nin: allUsersFromTheChat },
    name: { $regex: name, $options: "i" },
  });

  const users = allUsersExceptMeAndFriends.map(({ _id, name, avatar }) => {
    return { _id, name, avatar };
  });

  res
    .status(200)
    .json(new ApiResponse(200, users, "fetched user successfully"));
};

export const sendFriendRequest = async (req, res) => {
  const { userId } = req.body;
  const myId = req.user?._id;

  if (!userId && !myId) {
    throw new ApiError(400, "user id must be specified");
  }
  const request = await Request.findOne({
    $or: [
      { sender: myId, reciever: userId },
      { sender: userId, reciever: myId },
    ],
  });

  if (request) {
    throw new ApiError(400, "request already sent");
  }

  const chats = await Chat.find({
    members: { $in: [userId, myId.toString()] },
  });

  if (!chats) {
    throw new ApiError(400, "you both are already friends");
  }

  const newFriendRequest = await Request.create({
    sender: myId,
    reciever: userId,
    status: "PENDING",
  });

  if (!newFriendRequest) {
    throw new ApiError(404, "couldn't send friend request");
  }

  emitEvent(req, NEW_REQUEST, [userId], `request sent`);

  res
    .status(200)
    .json(new ApiResponse(200, newFriendRequest, "friend request sent"));
};

export const acceptFriendRequest = async (req, res) => {
  const { requestId, accept } = req.body;

  
  if (!requestId) {
    throw new ApiError(400,"must provide requeset id")
  }

  const request = await Request.findById(requestId)
    .populate("sender", "name")
    .populate("reciever", "name");

  if (!request) {
    throw new ApiError(400, "request not found");
  }

  if (request.reciever._id.toString() !== req.user?._id.toString()) {
    throw new ApiError(400, "you are not authorized to accept the request");
  }
  const members = [request.reciever._id, request.sender._id];

  if (accept) {
    const chat = await Chat.create({
      name: request.sender.name + request.reciever.name,
      members: members,
      groupChat: false,
      creator: request.sender._id,
    });
    await request.deleteOne();

    emitEvent(req,REFETCH_CHATS,members,``)

    res.
    status(200)
    .json(
        new ApiResponse(200,chat,"friend request accepted")
    )
  }else {
    await request.deleteOne();

    res
    .status(200)
    .json(
        new ApiResponse(200,{},"friend request rejected")
    )

  }
}

export const getAllNotificatin = async (req,res) => {

    const requests = await Request.find({reciever : req.user?._id}).populate("sender","name avatar");

    if (!requests){
        throw new ApiError(400,"no requests found")
    }

    const allRequests = requests.map(({sender}) => {
        return {
            _id : sender._id,
            name : sender.name,
            avatar : sender.avatar
        }
    })

    res
    .status(200)
    .json(
        new ApiResponse(200,allRequests,"notifications")
    )


}

export const getMyFriends = async (req,res) => {
  const chatId = req.query.chatId;

  const chats = await Chat.find({members : req.user?._id,groupChat : false}).populate("members","name avatar");

  const friends = chats.map(({members}) => {
    return {
      _id: members._id,
      name : members.name, 
      avatar : members.avatar
    }
  })

  if (!chats) {
    throw new ApiError(400,"no friends found")
  }


  if (chatId) {
    const chat = await Chat.findById(chatId);

    const availableFriends = friends.filter((friend) => !chat.members.includes(friend._id));

    res.status(200)
    .json(
      new ApiResponse(200,availableFriends,"fetched friends")
    )
  }
  else {
    res
    .status(200)
    .json(
      new ApiResponse(200,friends,"friends fetched successfully")
    )
  }
}