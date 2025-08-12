import multer from "multer";
import path from "path";
// Multer storage configuration
const storage1 = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(process.cwd(), "public", "uploads"));
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(process.cwd(), "public", "uploads"));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = `${Date.now()}`;
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext);
    cb(null, `${baseName}-${uniqueSuffix}${ext}`);
  },
});


const upload = multer({ storage });


const uploadVehicleDoc = upload.fields([
  { name: "insuranceCard", maxCount: 1 },
  { name: "vehicleImage", maxCount: 1 },
]);

const sendMsg = upload.single("fileImage");
const profileImage = upload.single("profileImage");
const uploadCategoryIcon = upload.single("categoryIcon");
const uploadProductImage = upload.array("productImage", 5);


// Export file uploader methods
export const fileUploader = {
  upload,
  profileImage,
  uploadVehicleDoc, uploadCategoryIcon,
  uploadProductImage,
  sendMsg
};
