
import { db } from "../config/firebase.js";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export const registerOC = async (req, res) => {
    try {
        const data = req.body;

        if (!data.name || !data.email || !data.phone || !data.college || !data.ocType || !data.yearOfStudy) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        if (data.ocType === "Internal OC" && !data.rollNumber) {
            return res.status(400).json({ error: "Roll Number is required for Internal OC" });
        }

        const refId = "MUNOC" + Date.now();

        const docRef = await addDoc(collection(db, "oc_registrations"), {
            ...data,
            registrationType: data.ocType,
            refId,
            createdAt: serverTimestamp()
        });

        res.status(201).json({
            success: true,
            message: "OC Registration successful",
            refId,
            id: docRef.id
        });
    } catch (error) {
        console.error("Error registering OC:", error);
        res.status(500).json({ error: error.message || "Internal server error" });
    }
};
