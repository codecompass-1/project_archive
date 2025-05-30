"use client";

import React, { useEffect, useState } from "react";
import { firestore, auth } from "@/lib/firebase/config";
import {
  collection,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function AdminPanel() {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRole = async () => {
      const user = auth.currentUser;
      if (!user?.email) {
        setUserRole(null);
        setLoading(false);
        return;
      }

      const docRef = doc(firestore, "adminemail", user.email);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setUserRole(docSnap.data().role);
      } else {
        setUserRole(null);
      }
      setLoading(false);
    };

    fetchRole();
  }, []);

  if (loading) return <div className="p-6">Loading...</div>;

  if (userRole !== "superadmin") {
    return (
      <div className="p-6 text-red-600 font-semibold">
        You are not authorized to access this page.
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Admin Panel</h1>
      <Tabs defaultValue="add">
        <TabsList className="mb-4">
          <TabsTrigger value="add">Add Admin</TabsTrigger>
          <TabsTrigger value="list">List Admins</TabsTrigger>
          <TabsTrigger value="remove">Remove Admin</TabsTrigger>
        </TabsList>
        <TabsContent value="add">
          <AddAdmin />
        </TabsContent>
        <TabsContent value="list">
          <AdminList />
        </TabsContent>
        <TabsContent value="remove">
          <RemoveAdmin />
        </TabsContent>
      </Tabs>
    </div>
  );
}

const AddAdmin = () => {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "superadmin">("admin");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const handleAdd = async () => {
    setStatus(null);
    setLoading(true);
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setStatus("Must be logged in.");
      setLoading(false);
      return;
    }

    const currentUserRef = doc(firestore, "adminemail", currentUser.email!);
    const currentUserSnap = await getDoc(currentUserRef);

    if (!currentUserSnap.exists() || currentUserSnap.data().role !== "superadmin") {
      setStatus("Not authorized.");
      setLoading(false);
      return;
    }

    try {
      const targetRef = doc(firestore, "adminemail", email);
      const targetSnap = await getDoc(targetRef);

      // If already exists, delete first
      if (targetSnap.exists()) {
        await deleteDoc(targetRef);
      }

      await setDoc(targetRef, {
        role,
        addedBy: currentUser.email,
        addedAt: Timestamp.now(),
        isActive: true,
      });

      setStatus(`Admin added successfully with role: ${role}`);
      setEmail("");
      setRole("admin");
      setConfirming(false);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setStatus("Error: " + err.message);
      } else {
        setStatus("An unknown error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input
        type="email"
        placeholder="Admin email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="border p-2 w-full rounded mb-2"
      />
      <select
        value={role}
        onChange={(e) => setRole(e.target.value as "admin" | "superadmin")}
        className="border p-2 w-full rounded mb-2"
      >
        <option value="admin">Admin</option>
        <option value="superadmin">Superadmin</option>
      </select>

      {!confirming ? (
        <button
          onClick={() => setConfirming(true)}
          disabled={loading || !email}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Add Admin
        </button>
      ) : (
        <div className="space-x-4">
          <button
            onClick={handleAdd}
            disabled={loading}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            Confirm Add
          </button>
          <button
            onClick={() => setConfirming(false)}
            disabled={loading}
            className="bg-gray-300 px-4 py-2 rounded"
          >
            Cancel
          </button>
        </div>
      )}

      {status && <p className="mt-2 text-sm">{status}</p>}
    </div>
  );
};

const AdminList = () => {
  interface Admin {
    id: string;
    role: string;
    addedBy: string;
    addedAt: Timestamp;
    isActive: boolean;
  }

  const [admins, setAdmins] = useState<Admin[]>([]);

  useEffect(() => {
    const fetchAdmins = async () => {
      const snap = await getDocs(collection(firestore, "adminemail"));
      const list = snap.docs.map((doc) => ({
        id: doc.id,
        role: doc.data().role,
        addedBy: doc.data().addedBy,
        addedAt: doc.data().addedAt,
        isActive: doc.data().isActive,
      }));
      setAdmins(list);
    };
    fetchAdmins();
  }, []);

  return (
    <div>
      {admins.map((admin) => (
        <div
          key={admin.id}
          className="border rounded p-4 mb-2 shadow-sm bg-gray-50"
        >
          <p>
            <strong>Email:</strong> {admin.id}
          </p>
          <p>
            <strong>Role:</strong> {admin.role}
          </p>
          <p>
            <strong>Added By:</strong> {admin.addedBy}
          </p>
          <p>
            <strong>Added At:</strong>{" "}
            {admin.addedAt?.toDate().toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  );
};

const RemoveAdmin = () => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  const handleRemove = async () => {
    setStatus(null);
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setStatus("Must be logged in.");
      return;
    }

    const ref = doc(firestore, "adminemail", currentUser.email!);
    const snap = await getDoc(ref);
    if (!snap.exists() || snap.data().role !== "superadmin") {
      setStatus("Not authorized.");
      return;
    }

    try {
      const removedAdmin = await getDoc(doc(firestore, "adminemail", email));
      if (!removedAdmin.exists()) {
        setStatus("Admin not found.");
        return;
      }

      await deleteDoc(doc(firestore, "adminemail", email));

      await setDoc(doc(firestore, "removedadmin", email), {
        email,
        removedBy: currentUser.email,
        removedAt: Timestamp.now(),
        roleAtRemoval: removedAdmin.data().role,
      });

      setStatus("Admin removed.");
      setEmail("");
      setConfirming(false);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setStatus("Error: " + err.message);
      } else {
        setStatus("An unknown error occurred.");
      }
    }
  };

  return (
    <div>
      <input
        type="email"
        placeholder="Admin email to remove"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="border p-2 w-full rounded mb-2"
      />
      {!confirming ? (
        <button
          onClick={() => setConfirming(true)}
          className="bg-red-600 text-white px-4 py-2 rounded"
        >
          Remove Admin
        </button>
      ) : (
        <div className="space-x-4">
          <button
            onClick={handleRemove}
            className="bg-red-600 text-white px-4 py-2 rounded"
          >
            Yes, Remove
          </button>
          <button
            onClick={() => setConfirming(false)}
            className="bg-gray-300 px-4 py-2 rounded"
          >
            Cancel
          </button>
        </div>
      )}
      {status && <p className="mt-2 text-sm">{status}</p>}
      <RemovedAdminsList />
    </div>
  );
};

const RemovedAdminsList = () => {
  interface RemovedAdmin {
    id: string;
    email: string;
    removedBy: string;
    roleAtRemoval: string;
    removedAt: Timestamp;
  }

  const [removed, setRemoved] = useState<RemovedAdmin[]>([]);

  useEffect(() => {
    const fetchRemoved = async () => {
      const snap = await getDocs(collection(firestore, "removedadmin"));
      const list = snap.docs.map((doc) => ({
        id: doc.id,
        email: doc.data().email,
        removedBy: doc.data().removedBy,
        roleAtRemoval: doc.data().roleAtRemoval,
        removedAt: doc.data().removedAt,
      }));
      setRemoved(list);
    };
    fetchRemoved();
  }, []);

  return (
    <div className="mt-6">
      <h3 className="font-semibold mb-2">Removed Admins</h3>
      {removed.map((admin) => (
        <div
          key={admin.id}
          className="border rounded p-4 mb-2 shadow-sm bg-red-50"
        >
          <p>
            <strong>Email:</strong> {admin.email}
          </p>
          <p>
            <strong>Removed By:</strong> {admin.removedBy}
          </p>
          <p>
            <strong>Role:</strong> {admin.roleAtRemoval}
          </p>
          <p>
            <strong>Removed At:</strong>{" "}
            {admin.removedAt?.toDate().toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  );
};
