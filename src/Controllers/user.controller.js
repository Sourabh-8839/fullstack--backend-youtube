import asyncHandler from "../Utilis/asyncHyndler.js";
import { ApiError } from "../Utilis/apiError.js";
import { User } from "../Model/user.model.js";
import { uploadOnCloudinary } from "../Utilis/cloudinary.js";
import { ApiResponse } from "../Utilis/apiResponse.js";
import jwt from "jsonwebtoken";
let options = {
  httpOnly: true,
  secure: true,
};

const genreateRefreshTokenAndaccessToken = async (user_id) => {
  try {
    const user = await User.findById(user_id);

    const accessToken = await user.generateAccessToken();

    const refreshToken = await user.generateRefreshToken();

    user.refreshToken = refreshToken;

    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while genrating refresh and access Token"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  //step 1 Extract data from req
  //step 2 check validation empty string
  //step 3 user is already exist
  //step 3 check file validation
  //step 4 upload file in cloud and store response
  //step 5 create user object
  //step 6 send response to user

  const { userName, email, fullName, password } = req.body;

  if (
    [userName, email, fullName, password].some((field) => field?.trim === "")
  ) {
    throw new ApiError(200, "All fields Required");
  }

  if (!email.includes("@gmail"))
    throw new ApiError(400, "email must required @gmail");

  const existedEmail = await User.findOne({ email: email });

  if (existedEmail) {
    throw new ApiError(409, "Email is already Existed");
  }

  const existedUserName = await User.findOne({ userName: userName });

  if (existedUserName) {
    throw new ApiError(409, "Username is already existed");
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;

  const coverImageLocalPath = req.files?.coverImage[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar File is Required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar File is Required after upload");
  }

  const user = await User.create({
    userName: userName.toLowerCase(),
    avatar: avatar?.url,
    coverImage: coverImage?.url || "",
    fullName,
    email,
    password,
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something Went Wrong While registring User");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered Succesfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password, userName } = req.body;

  if (!email && !userName) {
    throw new ApiError(401, "email or username is required");
  }

  const user = await User.findOne({
    $or: [{ email }, { userName }],
  });

  if (!user) {
    throw new ApiError(404, "user does not exist");
  }
  const isValidPassword = await user.isPasswordCorrect(password);

  if (!isValidPassword) {
    throw new ApiError(401, "Invalid user credentials");
  }

  const { accessToken, refreshToken } =
    await genreateRefreshTokenAndaccessToken(user._id);

  const updatedUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: updatedUser,
          accessToken,
          refreshToken,
        },
        "User login succesfully "
      )
    );
});

const logOutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: { refreshToken: "" },
    },
    { new: true }
  );

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(201, {}, "User Logut Successfully"));
});

const accessRefreshToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body?.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(400, "Unauthorized user");
  }

  try {
    const decode = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRETKEY
    );

    const user = await User.findById(decode?._id);

    if (!user) {
      throw new ApiError(401, "Invalid refreshToken");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(400, "RefreshToken is expired or used");
    }

    const { accessToken, refreshToken } =
      await genreateRefreshTokenAndaccessToken(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken },
          "Access Token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(400, "Invalid Refresh Token");
  }
});

export { registerUser, loginUser, logOutUser, accessRefreshToken };
