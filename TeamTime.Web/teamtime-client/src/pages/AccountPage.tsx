import ChangePasswordForm from "../components/ChangePasswordForm";

type AccountPageProps = {
  onSessionExpired: () => void;
};

export default function AccountPage({ onSessionExpired }: AccountPageProps) {
  return (
    <section aria-labelledby="account-heading">
      <h1 id="account-heading" className="text-2xl font-semibold">
        Account
      </h1>

      <p className="mt-2">Manage your password.</p>

      <div className="mt-6">
        <ChangePasswordForm onSessionExpired={onSessionExpired} />
      </div>
    </section>
  );
}
