
import { db } from "../config/firebase.js";
import { collection, getDocs, doc, updateDoc, setDoc } from "firebase/firestore";

export const getAdminData = async (req, res) => {
    try {
        const querySnapshot = await getDocs(collection(db, "registrations"));
        const delegateList = [];

        querySnapshot.forEach(docSnap => {
            const data = docSnap.data();

            if (data.isGroup && data.members) {
                data.members.forEach((member, idx) => {
                    delegateList.push({
                        id: docSnap.id + "_" + idx,
                        docId: docSnap.id,
                        name: member.name,
                        email: member.email,
                        college: data.college,
                        phone: member.phone,
                        registrationType: data.registrationType,
                        yearOfStudy: member.yearOfStudy,
                        rollNumber: member.rollNumber || "-",
                        munExperiences: member.munExperiences || "0",
                        munAwards: member.munAwards || "0",
                        amountToPay: data.amountToPay || "-",
                        refId: data.refId || "-",
                        utr: data.utr || "-",
                        verified: data.verified || false,
                        timestamp: data.createdAt?.toDate?.() ? data.createdAt.toDate().toISOString() : (data.timestamp || new Date(0).toISOString()),
                        paidAt: data.paidAt?.toDate?.() ? data.paidAt.toDate().toISOString() : null,
                        preferences: member.preferences || [],
                        allocation: member.allocation || null,
                        suggestedAllocation: null,
                        isGroup: true,
                        groupId: data.groupId,
                        groupSize: data.groupSize,
                        memberIndex: idx + 1,
                        memberNames: data.memberNames
                    });
                });
            } else {
                delegateList.push({
                    id: docSnap.id,
                    docId: docSnap.id,
                    name: data.name,
                    email: data.email,
                    college: data.college,
                    phone: data.phone,
                    registrationType: data.registrationType || "-",
                    yearOfStudy: data.yearOfStudy || "-",
                    rollNumber: data.rollNumber || "-",
                    munExperiences: data.munExperiences || "0",
                    munAwards: data.munAwards || "0",
                    amountToPay: data.amountToPay || "-",
                    refId: data.refId || "-",
                    utr: data.utr || "-",
                    verified: data.verified || false,
                    timestamp: data.createdAt?.toDate?.() ? data.createdAt.toDate().toISOString() : (data.timestamp || new Date(0).toISOString()),
                    paidAt: data.paidAt?.toDate?.() ? data.paidAt.toDate().toISOString() : null,
                    preferences: data.preferences || [],
                    allocation: data.allocation || null,
                    suggestedAllocation: null,
                    isGroup: false,
                    groupId: null
                });
            }
        });

        const ocSnapshot = await getDocs(collection(db, "oc_registrations"));
        const ocList = [];
        ocSnapshot.forEach(docSnap => {
            const data = docSnap.data();
            ocList.push({
                id: docSnap.id,
                name: data.name,
                email: data.email,
                college: data.college,
                phone: data.phone,
                ocType: data.ocType || data.registrationType || "-",
                yearOfStudy: data.yearOfStudy || "-",
                rollNumber: data.rollNumber || "-",
                amountToPay: data.amountToPay || "-",
                refId: data.refId || "-",
                utr: data.utr || "-",
                verified: data.verified || false,
                timestamp: data.createdAt?.toDate?.() ? data.createdAt.toDate().toISOString() : new Date(0).toISOString(),
            });
        });
        ocList.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        res.json({
            success: true,
            delegates: delegateList,
            ocMembers: ocList
        });

    } catch (error) {
        console.error("Error fetching admin data:", error);
        res.status(500).json({ error: error.message || "Internal server error" });
    }
};

export const allocateDelegate = async (req, res) => {
    try {
        const { docId, members, allocation, matrix } = req.body;

        if (members) {
            await updateDoc(doc(db, "registrations", docId), {
                members: members
            });
        } else if (allocation) {
            await updateDoc(doc(db, "registrations", docId), {
                allocation: allocation
            });
        }

        if (matrix) {
            await setDoc(doc(db, "public", "countryMatrix"), {
                matrix: matrix,
                lastUpdated: new Date().toISOString()
            });
        }

        res.json({ success: true });
    } catch (error) {
        console.error("Error allocating:", error);
        res.status(500).json({ error: error.message || "Internal server error" });
    }
};

export const deallocateDelegate = async (req, res) => {
    try {
        const { docId, members, matrix } = req.body;

        if (members) {
            await updateDoc(doc(db, "registrations", docId), {
                members: members
            });
        } else {
            await updateDoc(doc(db, "registrations", docId), {
                allocation: null
            });
        }

        if (matrix) {
            await setDoc(doc(db, "public", "countryMatrix"), {
                matrix: matrix,
                lastUpdated: new Date().toISOString()
            });
        }

        res.json({ success: true });
    } catch (error) {
        console.error("Error deallocating:", error);
        res.status(500).json({ error: error.message || "Internal server error" });
    }
};

export const verifyPayment = async (req, res) => {
    try {
        const { id, isOC } = req.body;
        const collectionName = isOC ? "oc_registrations" : "registrations";
        if (!id) return res.status(400).json({ error: "Missing document ID" });

        await updateDoc(doc(db, collectionName, id), {
            verified: true
        });

        res.json({ success: true });
    } catch (error) {
        console.error("Error verifying:", error);
        res.status(500).json({ error: error.message || "Internal server error" });
    }
};
