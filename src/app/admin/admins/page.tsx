"use client";

import { useEffect, useState } from "react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminsTable, { type AdminRow } from "@/components/admin/AdminsTable";
import AdminModal from "@/components/admin/AdminModal";
import { UserPlus, CheckCircle } from "lucide-react";

export default function AdminAdminsPage() {
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [currentUserId, setCurrentUserId] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingAdmin, setEditingAdmin] = useState<AdminRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const fetchAdmins = () => {
    fetch("/api/admin/admins")
      .then((r) => r.json())
      .then((data) => {
        if (data.admins) setAdmins(data.admins);
      });
  };

  useEffect(() => {
    fetchAdmins();
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.user?.id) setCurrentUserId(data.user.id);
      })
      .catch(() => {});
  }, []);

  const openCreate = () => {
    setModalMode("create");
    setEditingAdmin(null);
    setError("");
    setModalOpen(true);
  };

  const openEdit = (admin: AdminRow) => {
    setModalMode("edit");
    setEditingAdmin(admin);
    setError("");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingAdmin(null);
    setError("");
  };

  const handleCreate = async (data: { name: string; phone: string; pin: string }) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) {
        setError(result.error || "Erreur lors de la création");
        return;
      }
      setSuccess(`Compte administrateur créé pour ${result.user.name}`);
      closeModal();
      fetchAdmins();
      setTimeout(() => setSuccess(""), 3000);
    } catch {
      setError("Erreur serveur");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (data: { pin: string }) => {
    if (!editingAdmin) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/admins", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: editingAdmin.id, pin: data.pin }),
      });
      const result = await res.json();
      if (!res.ok) {
        setError(result.error || "Erreur lors de la mise à jour");
        return;
      }
      setSuccess(`PIN de ${result.user.name} mis à jour`);
      closeModal();
      fetchAdmins();
      setTimeout(() => setSuccess(""), 3000);
    } catch {
      setError("Erreur serveur");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (admin: AdminRow) => {
    if (
      !confirm(
        `Supprimer définitivement le compte administrateur de ${admin.name} ?`
      )
    )
      return;

    try {
      const res = await fetch(`/api/admin/admins?userId=${admin.id}`, {
        method: "DELETE",
      });
      const result = await res.json();
      if (!res.ok) {
        alert(result.error || "Erreur lors de la suppression");
        return;
      }
      setSuccess(`Compte de ${admin.name} supprimé`);
      fetchAdmins();
      setTimeout(() => setSuccess(""), 3000);
    } catch {
      alert("Erreur serveur");
    }
  };

  return (
    <>
      <AdminPageHeader
        title="Administrateurs"
        subtitle={`${admins.length} compte(s) administrateur`}
        actions={
          <button
            onClick={openCreate}
            className="flex items-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/30 transition-all hover:bg-primary-dark"
          >
            <UserPlus size={18} />
            Ajouter un administrateur
          </button>
        }
      />

      {success && (
        <div className="mb-4 flex items-center gap-2 rounded-2xl bg-green-50 px-4 py-3 text-sm text-green-600">
          <CheckCircle size={16} />
          {success}
        </div>
      )}

      <AdminsTable
        admins={admins}
        currentUserId={currentUserId}
        onEdit={openEdit}
        onDelete={handleDelete}
      />

      <AdminModal
        open={modalOpen}
        mode={modalMode}
        admin={editingAdmin}
        loading={loading}
        error={error}
        onClose={closeModal}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
      />
    </>
  );
}
