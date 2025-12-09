User joins company

System calculates years of experience

Based on years → rating assign hota hai

rating → se Performance Increment decide hota hai

years + rating → se Special Increment decide hota hai

Dono ka total → newSalary calculate hota hai

const mongoose = require("mongoose");

const AttendanceSchema = new mongoose.Schema({
  emp_name: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  check_in: {
    type: String,
    required: true,
  },
  check_out: {
    type: String,
    required: true,
  },
  remark: {
    type: String,
    default: null,
  },
  in_image: {
    type: String,
  },
  out_image: {
    type: String,
  },
  lunch_in_time: {
    type: String,
    default: null,
  },
  lunch_out_time: {
    type: String,
    default: null,
  },
  is_active: {
    type: Boolean,
    default: true,
  },
  is_delete: {
    type: Boolean,
    default: false,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Attendance", AttendanceSchema);

const data = [
  {
    _id: new mongoose.Types.ObjectId("507f1f77bcf86cd799439011"),
    emp_name: "6",
    date: new Date("2024-08-12T00:00:00.000Z"),
    check_in: "13:48:15",
    check_out: "13:48:37",
    remark: null,
    in_image: "1723450701_2024_48_12_13_48_15.webp",
    out_image: "1723450724_2024_48_12_13_48_37.webp",
    lunch_in_time: null,
    lunch_out_time: null,
    is_active: true,
    is_delete: false,
    created_at: new Date("2024-08-12T13:48:22.000Z"),
    updated_at: new Date("2024-08-12T13:48:44.000Z"),
  },
  {
    _id: new mongoose.Types.ObjectId("507f1f77bcf86cd799439012"),
    emp_name: "6",
    date: new Date("2024-08-12T00:00:00.000Z"),
    check_in: "14:11:56",
    check_out: "20:23:30",
    remark: null,
    in_image: "1723452152_2024_11_12_14_11_56.webp",
    out_image: "1723452270_attendance1.webp",
    lunch_in_time: null,
    lunch_out_time: null,
    is_active: true,
    is_delete: false,
    created_at: new Date("2024-08-12T14:12:32.000Z"),
    updated_at: new Date("2024-08-12T14:14:30.000Z"),
  },
  {
    _id: new mongoose.Types.ObjectId("507f1f77bcf86cd799439013"),
    emp_name: "6",
    date: new Date("2024-08-12T00:00:00.000Z"),
    check_in: "14:15:30",
    check_out: "14:20:06",
    remark: null,
    in_image: "1723452352_2024_15_12_14_15_30.webp",
    out_image: "1723452613_2024_20_12_14_20_06.webp",
    lunch_in_time: null,
    lunch_out_time: null,
    is_active: true,
    is_delete: false,
    created_at: new Date("2024-08-12T14:15:53.000Z"),
    updated_at: new Date("2024-08-12T14:20:14.000Z"),
  },
  {
    _id: new mongoose.Types.ObjectId("507f1f77bcf86cd799439014"),
    emp_name: "6",
    date: new Date("2024-08-12T00:00:00.000Z"),
    check_in: "14:20:21",
    check_out: "14:25:23",
    remark: null,
    in_image: "1723452628_2024_20_12_14_20_21.webp",
    out_image: "1723452929_2024_25_12_14_25_23.webp",
    lunch_in_time: null,
    lunch_out_time: null,
    is_active: true,
    is_delete: false,
    created_at: new Date("2024-08-12T14:20:28.000Z"),
    updated_at: new Date("2024-08-12T14:25:30.000Z"),
  },
  {
    _id: new mongoose.Types.ObjectId("507f1f77bcf86cd799439015"),
    emp_name: "6",
    date: new Date("2024-08-12T00:00:00.000Z"),
    check_in: "14:25:54",
    check_out: "14:26:11",
    remark: null,
    in_image: "1723452961_2024_25_12_14_25_54.webp",
    out_image: "1723452980_2024_26_12_14_26_11.webp",
    lunch_in_time: null,
    lunch_out_time: null,
    is_active: true,
    is_delete: false,
    created_at: new Date("2024-08-12T14:26:02.000Z"),
    updated_at: new Date("2024-08-12T14:26:22.000Z"),
  },
  {
    _id: new mongoose.Types.ObjectId("507f1f77bcf86cd799439016"),
    emp_name: "6",
    date: new Date("2024-08-12T00:00:00.000Z"),
    check_in: "15:02:24",
    check_out: "15:04:13",
    remark: null,
    in_image: "1723455181_2024_02_12_15_02_24.webp",
    out_image: "1723455297_2024_04_12_15_04_13.webp",
    lunch_in_time: null,
    lunch_out_time: null,
    is_active: true,
    is_delete: false,
    created_at: new Date("2024-08-12T15:03:08.000Z"),
    updated_at: new Date("2024-08-12T15:05:04.000Z"),
  },
  {
    _id: new mongoose.Types.ObjectId("507f1f77bcf86cd799439017"),
    emp_name: "4",
    date: new Date("2024-08-12T00:00:00.000Z"),
    check_in: "15:40:01",
    check_out: "15:57:24",
    remark: null,
    in_image: "1723457406_2024_40_12_15_40_01.webp",
    out_image: "1723458450_2024_57_12_15_57_24.webp",
    lunch_in_time: null,
    lunch_out_time: null,
    is_active: true,
    is_delete: false,
    created_at: new Date("2024-08-12T15:40:08.000Z"),
    updated_at: new Date("2024-08-12T15:57:32.000Z"),
  },
  {
    _id: new mongoose.Types.ObjectId("507f1f77bcf86cd799439018"),
    emp_name: "8",
    date: new Date("2024-08-12T00:00:00.000Z"),
    check_in: "15:41:33",
    check_out: "15:58:06",
    remark: null,
    in_image: "1723457502_2024_41_12_15_41_33.webp",
    out_image: "1723458496_2024_58_12_15_58_06.webp",
    lunch_in_time: null,
    lunch_out_time: null,
    is_active: true,
    is_delete: false,
    created_at: new Date("2024-08-12T15:41:44.000Z"),
    updated_at: new Date("2024-08-12T15:58:17.000Z"),
  },
  {
    _id: new mongoose.Types.ObjectId("507f1f77bcf86cd799439019"),
    emp_name: "7",
    date: new Date("2024-08-12T00:00:00.000Z"),
    check_in: "15:42:34",
    check_out: "15:43:02",
    remark: null,
    in_image: "1723457567_2024_42_12_15_42_34.webp",
    out_image: "1723457594_2024_43_12_15_43_02.webp",
    lunch_in_time: null,
    lunch_out_time: null,
    is_active: true,
    is_delete: false,
    created_at: new Date("2024-08-12T15:42:51.000Z"),
    updated_at: new Date("2024-08-12T15:43:18.000Z"),
  },
];

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/employeeDB", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

mongoose.connection.once("open", async () => {
  console.log("MongoDB connected");

  try {
    // Check if attendance data already exists
    const attendanceCount = await mongoose.model("Attendance").countDocuments();

    if (attendanceCount === 0) {
      // Insert the data directly (no need to format as we already created proper objects)
      await mongoose.model("Attendance").insertMany(data);
      console.log("Dummy attendance data added successfully");
    } else {
      console.log("Attendance data already exists, skipping insertion");
    }
  } catch (err) {
    console.error("Error seeding attendance data:", err);
  }
});