"use client";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface InviteInfo {
  email: string;
  businessName: string;
  role: string;
}

export default function AcceptInvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const router = useRouter();

  const [info, setInfo] = useState<InviteInfo | null>(null);
  const [invalidMsg, setInvalidMsg] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    fetch(`/api/invite/${token}`)
      .then(async (res) => {
        if (res.ok) {
          const d = await res.json();
          setInfo(d);
        } else {
          const d = await res.json();
          setInvalidMsg(d.error ?? "Invalid invitation");
        }
      })
      .catch(() => setInvalidMsg("Could not connect to server"));
  }, [token]);

  async function handleAccept(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/invite/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, password }),
      });
      const d = await res.json();
      if (res.ok) {
        setDone(true);
        setTimeout(() => router.push(`/login?email=${encodeURIComponent(d.email)}`), 2000);
      } else {
        setError(d.error ?? "An error occurred");
      }
    } catch {
      setError("Could not connect to server");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-blue-700">
            Mohasabai · محاسباي
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-8">
          {/* Loading */}
          {!info && !invalidMsg && (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {/* Invalid / expired */}
          {invalidMsg && (
            <div className="text-center">
              <div className="text-4xl mb-4">❌</div>
              <h1 className="text-xl font-bold text-gray-900 mb-2">Invitation Expired</h1>
              <p className="text-gray-500 text-sm mb-6">{invalidMsg}</p>
              <Link href="/login" className="btn-primary text-sm">
                Go to Login
              </Link>
            </div>
          )}

          {/* Success */}
          {done && (
            <div className="text-center">
              <div className="text-4xl mb-4">✅</div>
              <h1 className="text-xl font-bold text-gray-900 mb-2">Account Created!</h1>
              <p className="text-gray-500 text-sm">Redirecting you to login…</p>
            </div>
          )}

          {/* Accept form */}
          {info && !done && (
            <>
              <div className="text-center mb-6">
                <div className="text-3xl mb-3">✉️</div>
                <h1 className="text-xl font-bold text-gray-900 mb-1">
                  You&apos;re Invited
                </h1>
                <p className="text-gray-500 text-sm">
                  Join <span className="font-semibold text-gray-800">{info.businessName}</span> as an{" "}
                  <span className="text-blue-600 font-medium">Accountant</span>
                </p>
              </div>

              <form onSubmit={handleAccept} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    className="input bg-gray-50 cursor-not-allowed"
                    value={info.email}
                    readOnly
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    className="input"
                    placeholder="Your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    className="input"
                    placeholder="Min. 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    className="input"
                    placeholder="Repeat password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    autoComplete="new-password"
                    dir="ltr"
                  />
                </div>
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">
                    {error}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={submitting || !name.trim() || !password || !confirm}
                  className="btn-primary w-full disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? "Creating account…" : "Accept Invitation"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
