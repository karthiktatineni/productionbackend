
import { db } from "../config/firebase.js";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export const registerSolo = async (req, res) => {
    try {
        const data = req.body;
        const refId = "MUNIARE" + Date.now();

        await addDoc(collection(db, "registrations"), {
            ...data,
            isGroup: false,
            refId,
            createdAt: serverTimestamp()
        });

        res.status(201).json({ success: true, message: "Registration successful", refId });
    } catch (error) {
        console.error("Error in solo registration:", error);
        res.status(500).json({ error: error.message || "Internal server error" });
    }
};

export const registerGroup = async (req, res) => {
    try {
        const data = req.body;
        const refId = "MUNIARE" + Date.now();

        await addDoc(collection(db, "registrations"), {
            ...data,
            isGroup: true,
            refId,
            createdAt: serverTimestamp()
        });

        res.status(201).json({ success: true, message: "Group registration successful", refId });
    } catch (error) {
        console.error("Error in group registration:", error);
        res.status(500).json({ error: error.message || "Internal server error" });
    }
};
