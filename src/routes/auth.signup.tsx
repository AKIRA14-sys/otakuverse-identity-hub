import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

import { OtkButton } from "@/components/otk/button";
import { ConnectionGuard } from "@/components/otk/connection-guard";
import { CountrySelect } from "@/components/otk/country-select";
import { SelectField, TextField } from "@/components/otk/field";
import { Notice, Panel, Screen, StepProgress } from "@/components/otk/shell";
import { COUNTRY_BY_CODE } from "@/data/countries";
import { meetsMinimumAge, MIN_SIGNUP_AGE } from "@/lib/age";
import { useAuth } from "@/lib/auth";
import { isValidPhone } from "@/lib/phone";
import { isUsernameAvailable } from "@/lib/profile";
import { isSupabaseConfigured } from "@/lib/supabase";
import type { Gender } from "@/types/database";

export const Route = createFileRoute("/auth/signup")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Create profile — OTAKUVERSE" },
      {
        name: "description",
        content: "Create your OTAKUVERSE identity. Permanent ID for anime and manga fans.",
      },
      { property: "og:title", content: "Create profile — OTAKUVERSE" },
      {
        property: "og:description",
        content: "Create your OTAKUVERSE identity.",
      },
    ],
  }),
  component: SignupPage,
});

const TOTAL_STEPS = 4;

function SignupPage() {
  const { signUp, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);

  const [countryCode, setCountryCode] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState<Gender | "">("");

  const dial = countryCode ? COUNTRY_BY_CODE[countryCode]?.dial : undefined;

  const usernameNormalized = useMemo(
    () => username.trim().toLowerCase().replace(/[^a-z0-9_]/g, ""),
    [username],
  );

  useEffect(() => {
    if (!authLoading && user) {
      navigate({ to: "/profile", replace: true });
    }
  }, [authLoading, user, navigate]);

  async function goNext() {
    setError(null);

    if (step === 1) {
      if (!countryCode) return setError("Select your country first.");
      if (!phone.trim()) return setError("Enter your phone number.");
      if (!isValidPhone(phone, countryCode)) {
        return setError("That phone number isn't valid for the selected country.");
      }
      setStep(2);
      return;
    }

    if (step === 2) {
      if (usernameNormalized.length < 3 || usernameNormalized.length > 24) {
        return setError("Username must be 3–24 characters (letters, numbers, underscore).");
      }
      if (!/^[a-z0-9_]+$/.test(usernameNormalized)) {
        return setError("Username can only use lowercase letters, numbers, and underscores.");
      }
      if (!displayName.trim()) return setError("Enter a display name.");
      setCheckingUsername(true);
      try {
        const available = await isUsernameAvailable(usernameNormalized);
        if (!available) return setError("That username is already taken.");
        setStep(3);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not check username.");
      } finally {
        setCheckingUsername(false);
      }
      return;
    }

    if (step === 3) {
      if (!email.trim() || !email.includes("@")) return setError("Enter a valid email.");
      if (password.length < 8) return setError("Password must be at least 8 characters.");
      setStep(4);
      return;
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (step < TOTAL_STEPS) {
      await goNext();
      return;
    }

    if (!dateOfBirth) return setError("Enter your date of birth.");
    if (!meetsMinimumAge(dateOfBirth)) {
      return setError(`You must be at least ${MIN_SIGNUP_AGE} years old.`);
    }
    if (!gender) return setError("Select a gender option.");
    if (!countryCode) return setError("Select your country.");

    setSubmitting(true);
    try {
      const result = await signUp({
        email: email.trim(),
        password,
        username: usernameNormalized,
        displayName: displayName.trim(),
        countryCode,
        phone: phone.trim(),
        dateOfBirth,
        gender: gender as Gender,
      });

      if (result.needsEmailVerification) {
        navigate({
          to: "/auth/verify-email",
          search: { email: email.trim() },
          replace: true,
        });
      } else {
        navigate({ to: "/profile", replace: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create your account.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen eyebrow="SIGN UP">
      <section className="mt-9">
        <h1 className="font-display text-5xl font-bold leading-none text-balance">
          Create your
          <br />
          identity.
        </h1>
        <p className="mt-4 text-sm text-mist">
          One permanent ID. Your character starts here.
        </p>
      </section>

      <div className="mt-6">
        <StepProgress step={step} total={TOTAL_STEPS} />
      </div>

      <ConnectionGuard>
        <form onSubmit={onSubmit} className="mt-6">
          <Panel>
            {step === 1 && (
              <>
                <CountrySelect
                  value={countryCode}
                  onChange={(code) => {
                    setCountryCode(code);
                    setPhone("");
                  }}
                />
                <TextField
                  label={dial ? `Phone (${dial})` : "Phone number"}
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel-national"
                  required
                  disabled={!countryCode}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={countryCode ? "National number" : "Select country first"}
                />
                <p className="mt-2 text-[11px] text-mist">
                  Stored in international E.164 format. SMS verification comes later — email is used
                  for account confirmation now.
                </p>
              </>
            )}

            {step === 2 && (
              <>
                <TextField
                  label="Username"
                  autoComplete="username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="lowercase_letters"
                />
                <p className="mt-1 text-[11px] text-mist">
                  3–24 characters. Letters, numbers, underscore. Becomes your public handle.
                </p>
                <TextField
                  label="Display name"
                  autoComplete="nickname"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="How you appear"
                />
              </>
            )}

            {step === 3 && (
              <>
                <TextField
                  label="Email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
                <TextField
                  label="Password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                />
              </>
            )}

            {step === 4 && (
              <>
                <TextField
                  label="Date of birth"
                  type="date"
                  required
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                />
                <p className="mt-1 text-[11px] text-mist">
                  Exact date stays private. Age is derived when needed. Minimum age: {MIN_SIGNUP_AGE}.
                </p>
                <SelectField
                  label="Gender"
                  required
                  value={gender}
                  onChange={(e) => setGender(e.target.value as Gender | "")}
                >
                  <option value="">Select…</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </SelectField>
              </>
            )}

            {error ? <Notice>{error}</Notice> : null}

            <div className="mt-5 flex gap-3">
              {step > 1 ? (
                <OtkButton
                  type="button"
                  variant="panel"
                  size="block"
                  className="flex-1"
                  onClick={() => {
                    setError(null);
                    setStep((s) => s - 1);
                  }}
                  disabled={submitting}
                >
                  Back
                </OtkButton>
              ) : null}
              <OtkButton
                type="submit"
                size="block"
                className="flex-1"
                disabled={
                  submitting ||
                  checkingUsername ||
                  !isSupabaseConfigured ||
                  (step === 1 && !countryCode)
                }
              >
                {submitting
                  ? "Creating…"
                  : checkingUsername
                    ? "Checking…"
                    : step < TOTAL_STEPS
                      ? "Continue"
                      : "Create profile"}
              </OtkButton>
            </div>

            <div className="mt-4 text-center text-xs">
              <Link to="/auth/login" className="text-mist hover:text-snow">
                Already have an account? Sign in
              </Link>
            </div>
          </Panel>
        </form>
      </ConnectionGuard>
    </Screen>
  );
}
