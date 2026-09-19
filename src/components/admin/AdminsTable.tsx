"use client";

import { formatPhone } from "@/lib/utils";
import { Pencil, Trash2, ShieldCheck } from "lucide-react";

export interface AdminRow {
  id: string;
  name: string;
  phone: string;
}

interface AdminsTableProps {
  admins: AdminRow[];
  currentUserId: string;
  onEdit: (admin: AdminRow) => void;
  onDelete: (admin: AdminRow) => void;
}

export default function AdminsTable({
  admins,
  currentUserId,
  onEdit,
  onDelete,
}: AdminsTableProps) {
  return (
    <div className="overflow-hidden rounded-3xl bg-white/90 shadow-sm backdrop-blur-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px]">
          <thead>
            <tr className="border-b border-gray-100 text-left text-xs font-medium text-gray-400">
              <th className="px-4 py-3">Administrateur</th>
              <th className="px-4 py-3">Téléphone</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {admins.map((admin) => {
              const isSelf = admin.id === currentUserId;
              return (
                <tr
                  key={admin.id}
                  className="border-b border-gray-50 transition-colors hover:bg-primary/5"
                >
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
                        {admin.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="flex items-center gap-1.5 text-sm font-semibold text-gray-800">
                          {admin.name}
                          {isSelf && (
                            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                              Vous
                            </span>
                          )}
                        </p>
                        <p className="flex items-center gap-1 text-xs text-gray-400">
                          <ShieldCheck size={12} />
                          Administrateur
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-700">
                    {formatPhone(admin.phone)}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onEdit(admin)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-primary/10 hover:text-primary"
                        title="Modifier le PIN"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => onDelete(admin)}
                        disabled={isSelf || admins.length <= 1}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-400"
                        title={
                          isSelf
                            ? "Vous ne pouvez pas supprimer votre propre compte"
                            : admins.length <= 1
                              ? "Impossible de supprimer le dernier administrateur"
                              : "Supprimer"
                        }
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {admins.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-12 text-center text-sm text-gray-400">
                  Aucun administrateur trouvé
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
