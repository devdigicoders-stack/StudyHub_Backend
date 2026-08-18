const admin = require("firebase-admin");
const serviceAccount = require("../serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
 storageBucket: "studygrouphub-ce4da.appspot.com" // 🔥 change this
});

const db = admin.firestore();
const bucket = admin.storage().bucket();

//  Upload file to Firebase Storage
const uploadFileToFirebase = async (file) => {
  try {
    const fileName = `study/${Date.now()}_${file.originalname}`;
    const fileUpload = bucket.file(fileName);

    await fileUpload.save(file.buffer, {
      metadata: {
        contentType: file.mimetype,
      },
    });

    await fileUpload.makePublic();

    const fileUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

    return fileUrl;
  } catch (error) {
    console.error("Firebase Upload Error:", error);
    throw error;
  }
};

module.exports = { db, uploadFileToFirebase };