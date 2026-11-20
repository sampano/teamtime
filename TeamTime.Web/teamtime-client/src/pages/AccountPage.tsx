import ChangePasswordForm from "../components/ChangePasswordForm";

type AccountPageProps = {
  onSessionExpired: () => void;
};

export default function AccountPage({ onSessionExpired }: AccountPageProps) {
  return (
    <section aria-labelledby="account-heading" className="space-y-6">
      <div>
        <h1
          id="account-heading"
          className="font-display text-xl font-bold
                     tracking-tight text-slate-900"
        >
          Account
        </h1>

        <p className="mt-0.5 text-xs text-slate-500">Manage your password.</p>
      </div>

      <ChangePasswordForm onSessionExpired={onSessionExpired} />
    </section>
  );
}
