"use client";

import { useEffect, useState } from "react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AgentsTable, { type AgentRow } from "@/components/admin/AgentsTable";
import AgentModal from "@/components/admin/AgentModal";
import AgentProspectsModal from "@/components/admin/AgentProspectsModal";
import { UserPlus, CheckCircle } from "lucide-react";

export default function AdminAgentsPage() {
  const [agents, setAgents] = useState<AgentRow[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingAgent, setEditingAgent] = useState<AgentRow | null>(null);
  const [prospectsAgent, setProspectsAgent] = useState<AgentRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const fetchAgents = () => {
    fetch("/api/admin/agents")
      .then((r) => r.json())
      .then((data) => {
        if (data.agents) setAgents(data.agents);
      });
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  const openCreate = () => {
    setModalMode("create");
    setEditingAgent(null);
    setError("");
    setModalOpen(true);
  };

  const openEdit = (agent: AgentRow) => {
    setModalMode("edit");
    setEditingAgent(agent);
    setError("");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingAgent(null);
    setError("");
  };

  const handleCreate = async (data: {
    name: string;
    phone: string;
    pin: string;
    monthlyTarget: string;
    initialBalance: string;
  }) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          phone: data.phone,
          pin: data.pin,
          monthlyTarget: Number(data.monthlyTarget) || 0,
          initialBalance: Number(data.initialBalance) || 0,
        }),
      });
      const result = await res.json();
      if (!res.ok) {
        setError(result.error || "Erreur lors de la création");
        return;
      }
      setSuccess(`Compte créé pour ${result.user.name}`);
      closeModal();
      fetchAgents();
      setTimeout(() => setSuccess(""), 3000);
    } catch {
      setError("Erreur serveur");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (data: {
    monthlyTarget: string;
    monthlyAchieved: string;
    balance: string;
  }) => {
    if (!editingAgent) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/agents", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: editingAgent.id,
          monthlyTarget: Number(data.monthlyTarget),
          monthlyAchieved: Number(data.monthlyAchieved),
          balance: Number(data.balance),
        }),
      });
      const result = await res.json();
      if (!res.ok) {
        setError(result.error || "Erreur lors de la mise à jour");
        return;
      }
      setSuccess(`Compte de ${result.user.name} mis à jour`);
      closeModal();
      fetchAgents();
      setTimeout(() => setSuccess(""), 3000);
    } catch {
      setError("Erreur serveur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AdminPageHeader
        title="Agents"
        subtitle={`${agents.length} agent(s) commercial(aux)`}
        actions={
          <button
            onClick={openCreate}
            className="flex items-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/30 transition-all hover:bg-primary-dark"
          >
            <UserPlus size={18} />
            Ajouter un agent
          </button>
        }
      />

      {success && (
        <div className="mb-4 flex items-center gap-2 rounded-2xl bg-green-50 px-4 py-3 text-sm text-green-600">
          <CheckCircle size={16} />
          {success}
        </div>
      )}

      <AgentsTable
        agents={agents}
        onEdit={openEdit}
        onViewProspects={setProspectsAgent}
      />

      <AgentModal
        open={modalOpen}
        mode={modalMode}
        agent={editingAgent}
        loading={loading}
        error={error}
        onClose={closeModal}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
      />

      <AgentProspectsModal
        open={!!prospectsAgent}
        agentId={prospectsAgent?.id ?? null}
        agentName={prospectsAgent?.name}
        onClose={() => setProspectsAgent(null)}
      />
    </>
  );
}
