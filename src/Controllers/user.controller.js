import asyncHandler from "../Utilis/asyncHyndler.js";

const registerUser = asyncHandler(async (req, res) => {
  res.status(200).json({ message: "Perfect" });
});

export { registerUser };
