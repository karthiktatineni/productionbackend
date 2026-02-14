
import { db } from "../config/firebase.js";
import { collection, query, where, getDocs, updateDoc, doc, serverTimestamp } from "firebase/firestore";

// Pricing Constants
const PRICING = {
    // Delegate Solo Pricing
    "School Solo Delegates": { base: 999 },
    "Internal Solo Delegates": { "1st Year": 999, default: 1299 },
    "External Solo Delegates": { "1st Year": 1199, default: 1399 },

    // Delegate Group Pricing (per delegate)
    "School Group Delegation": { perMember: 859 },
    "Internal Group Delegation": { perMember: 1199 },
    "External Group Delegation": { perMember: 1299 },

    // OC Pricing
    "Internal OC": { "1st Year": 799, default: 899 },
    "External OC": { "1st Year": 899, default: 999 },
};

const calculateAmount = (data, isOCReg) => {
    const { registrationType, yearOfStudy, groupSize, isGroup } = data;

    // OC Registration
    if (isOCReg || registrationType === "Internal OC" || registrationType === "External OC") {
        const pricing = PRICING[registrationType];
        if (!pricing) return 999;
        return yearOfStudy === "1st Year" ? pricing["1st Year"] : pricing.default;
    }

    // Group Delegation
    if (isGroup && groupSize) {
        const pricing = PRICING[registrationType];
        if (pricing && pricing.perMember) {
            return pricing.perMember * groupSize;
        }
    }

    // Solo Delegates
    if (registrationType === "School Solo Delegates") {
        return PRICING["School Solo Delegates"].base;
    }

    if (registrationType === "Internal Solo Delegates") {
        return yearOfStudy === "1st Year"
            ? PRICING["Internal Solo Delegates"]["1st Year"]
            : PRICING["Internal Solo Delegates"].default;
    }

    if (registrationType === "External Solo Delegates") {
        return yearOfStudy === "1st Year"
            ? PRICING["External Solo Delegates"]["1st Year"]
            : PRICING["External Solo Delegates"].default;
    }

    // Fallback
    if (registrationType?.includes("School")) return 999;
    if (registrationType?.includes("Internal")) return yearOfStudy === "1st Year" ? 999 : 1299;
    if (registrationType?.includes("External")) return yearOfStudy === "1st Year" ? 1199 : 1399;

    return 1000;
};

export const getPaymentDetails = async (req, res) => {
    try {
        const { refId } = req.params;
        if (!refId) return res.status(400).json({ error: "Missing refId" });

        let collectionName = "registrations";
        let q = query(collection(db, collectionName), where("refId", "==", refId.trim()));
        let snapshot = await getDocs(q);

        if (snapshot.empty) {
            collectionName = "oc_registrations";
            q = query(collection(db, collectionName), where("refId", "==", refId.trim()));
            snapshot = await getDocs(q);
        }

        if (snapshot.empty) {
            return res.status(404).json({ error: "Registration not found" });
        }

        const docSnapshot = snapshot.docs[0];
        const data = docSnapshot.data();
        const id = docSnapshot.id;

        const amount = calculateAmount(data, collectionName === "oc_registrations");

        // Update amountToPay if not set or different
        try {
            await updateDoc(doc(db, collectionName, id), { amountToPay: amount });
        } catch (err) {
            console.error("Warning: Could not update amountToPay in Firestore:", err.message);
            // Non-critical, continue
        }

        res.json({
            success: true,
            data: {
                ...data,
                id,
                collectionName,
                amountToPay: amount
            }
        });

    } catch (error) {
        console.error("Error fetching payment details:", error);
        res.status(500).json({ error: error.message || "Internal server error" });
    }
};

export const submitPayment = async (req, res) => {
    try {
        const { refId, utr } = req.body;

        if (!refId || !utr) {
            return res.status(400).json({ error: "Missing refId or utr" });
        }

        if (!/^\d{12}$/.test(utr.trim())) {
            return res.status(400).json({ error: "Invalid UTR format" });
        }

        // Check for duplicate UTR
        const utrCheck1 = await getDocs(query(collection(db, "registrations"), where("utr", "==", utr.trim())));
        const utrCheck2 = await getDocs(query(collection(db, "oc_registrations"), where("utr", "==", utr.trim())));

        let collectionName = "registrations";
        let q = query(collection(db, collectionName), where("refId", "==", refId.trim()));
        let snapshot = await getDocs(q);

        if (snapshot.empty) {
            collectionName = "oc_registrations";
            q = query(collection(db, collectionName), where("refId", "==", refId.trim()));
            snapshot = await getDocs(q);
        }

        if (snapshot.empty) {
            return res.status(404).json({ error: "Registration not found" });
        }

        const currentDocId = snapshot.docs[0].id;
        const currentData = snapshot.docs[0].data();

        const isDuplicate = [...utrCheck1.docs, ...utrCheck2.docs].some(d => d.id !== currentDocId);

        if (isDuplicate) {
            return res.status(400).json({ error: "This UTR has already been used." });
        }

        await updateDoc(doc(db, collectionName, currentDocId), {
            utr: utr.trim(),
            paidAt: serverTimestamp(),
        });

        syncToGoogleSheets(currentData, collectionName, utr.trim(), calculateAmount(currentData, collectionName === "oc_registrations"))
            .catch(err => console.error("Sheet sync failed:", err));

        res.json({ success: true, message: "Payment recorded successfully" });

    } catch (error) {
        console.error("Error submitting payment:", error);
        res.status(500).json({ error: error.message || "Internal server error" });
    }
};

const syncToGoogleSheets = async (data, collectionName, utr, amount) => {
    const scriptUrl = process.env.VITE_SHEETS_API_URL;
    if (!scriptUrl) return;

    let flattenedData;
    const isOC = collectionName === "oc_registrations";

    if (isOC) {
        flattenedData = {
            timestamp: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
            name: data.name,
            email: data.email,
            phone: data.phone,
            college: data.college,
            registrationType: data.registrationType,
            yearOfStudy: data.yearOfStudy,
            refId: data.refId,
            rollNumber: data.rollNumber || "-",
            amount: amount,
            utr: utr,
            isOC: true
        };
    } else if (data.isGroup) {
        flattenedData = {
            timestamp: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
            name: data.memberNames?.join(", ") || "-",
            email: data.members?.map(m => m.email).join(", ") || "-",
            phone: data.members?.map(m => m.phone).join(", ") || "-",
            college: data.college,
            registrationType: data.registrationType,
            yearOfStudy: data.members?.map(m => m.yearOfStudy).join(", ") || "-",
            refId: data.refId,
            groupSize: data.groupSize,
            groupId: data.groupId,
            amount: amount,
            utr: utr,
            isGroup: true,
        };
    } else {
        flattenedData = {
            timestamp: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
            name: data.name,
            email: data.email,
            phone: data.phone,
            college: data.college,
            registrationType: data.registrationType,
            yearOfStudy: data.yearOfStudy,
            refId: data.refId,
            amount: amount,
            utr: utr,
            pref1_committee: data.preferences?.[0]?.committee || "-",
            pref1_countries: data.preferences?.[0]?.countries?.join(", ") || "-",
            pref2_committee: data.preferences?.[1]?.committee || "-",
            pref2_countries: data.preferences?.[1]?.countries?.join(", ") || "-",
            pref3_committee: data.preferences?.[2]?.committee || "-",
            pref3_countries: data.preferences?.[2]?.countries?.join(", ") || "-",
        };
    }

    try {
        await fetch(scriptUrl, {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                data: [flattenedData]
            }),
        });
    } catch (err) {
        console.error("Sheet Sync API Error:", err);
    }
};
