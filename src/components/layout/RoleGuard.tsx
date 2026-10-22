'use client';

import React, { useState } from 'react';
import { ShieldAlert, KeyRound, ArrowRight, UserCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../lib/types';

interface RoleGuardProps {
  module: string;
  allowedRoles?: UserRole[];
  children: React.ReactNode;
}

export function RoleGuard({ module, allowedRoles, children }: RoleGuardProps) {
  const { currentRole, currentUser, isLocked, unlockWithPin, switchRole, hasPermission } = useAuth();
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  // 1. If screen is locked with PIN
  if (isLocked) {
    const handleUnlock = (e: React.FormEvent) => {
      e.preventDefault();
      const success = unlockWithPin(pinInput);
      if (!success) {
        setPinError(true);
        setPinInput('');
      }
    };

    return (
      <div className="flex-1 flex items-center justify-center p-6 bg-black">
        <div className="max-w-md w-full p-8 rounded-3xl bg-zinc-950 border border-zinc-800 shadow-2xl text-center space-y-6 animate-slide-up">
          <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-700 text-white mx-auto flex items-center justify-center shadow-lg shadow-white/5">
            <KeyRound className="w-8 h-8 text-white" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-white">POS Terminal Locked</h2>
            <p className="text-sm text-zinc-400 mt-1">
              Logged in as <strong className="text-white">{currentUser.name}</strong> ({currentUser.role}). Enter PIN to unlock. (Demo PIN: <strong>{currentUser.pin || '1234'}</strong>)
            </p>
          </div>

          <form onSubmit={handleUnlock} className="space-y-4">
            <input
              type="password"
              maxLength={6}
              autoFocus
              value={pinInput}
              onChange={e => {
                setPinInput(e.target.value);
                setPinError(false);
              }}
              placeholder="Enter PIN"
              className="w-full text-center tracking-[0.5em] text-2xl font-mono py-3 px-4 rounded-xl bg-black border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-white"
            />
            {pinError && <p className="text-xs text-rose-400 font-medium">Incorrect PIN. Try {currentUser.pin || '1234'}.</p>}

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-white hover:bg-zinc-200 text-black font-bold text-sm transition shadow-lg"
            >
              Unlock Terminal
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 2. Check if current role has permission
  const permitted = allowedRoles ? allowedRoles.includes(currentRole) : hasPermission(module);

  if (!permitted) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 bg-black">
        <div className="max-w-lg w-full p-8 rounded-3xl bg-zinc-950 border border-zinc-800 shadow-2xl text-center space-y-6 animate-slide-up">
          <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-700 text-rose-400 mx-auto flex items-center justify-center shadow-lg">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-white">Restricted Access</h2>
            <p className="text-sm text-zinc-400 mt-1">
              The current active role (<strong className="text-white capitalize">{currentRole}</strong>) does not have authorization to view the <span className="text-white font-semibold underline">{module}</span> module.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-black border border-zinc-800 text-left space-y-3">
            <p className="text-xs font-semibold text-zinc-300">Switch to an authorized role to test:</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => switchRole('admin')}
                className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-600 text-xs font-medium text-white transition"
              >
                <span>Admin (Full Access)</span>
                <ArrowRight className="w-3.5 h-3.5 text-white" />
              </button>
              <button
                onClick={() => switchRole('manager')}
                className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-600 text-xs font-medium text-white transition"
              >
                <span>Manager</span>
                <ArrowRight className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
