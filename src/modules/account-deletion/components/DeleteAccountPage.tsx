import Image from "next/image";
import Link from "next/link";
import WelcomeFooter from "@/modules/welcome/components/shared/WelcomeFooter";
import GradientBackground from "@/modules/welcome/components/shared/GradientBackground";
import {
  APP_NAME,
  BACKUP_ROLLOVER_PERIOD,
  DELETION_EMAIL_SUBJECT,
  DEVELOPER_NAME,
  EMAIL_DELETION_PERIOD,
  GRIEVANCE_OFFICER,
  IN_APP_STEPS,
  KEPT_RECORDS,
  PRIVACY_URL,
  REGISTERED_ADDRESS,
  SUPPORT_EMAIL,
} from "../constants/content";
import DeleteAccountPanel from "./DeleteAccountPanel";
import DeletedDataList from "./sections/DeletedDataList";
import PolicySection from "./shared/PolicySection";

const linkClass =
  "text-primary-main-dark font-medium underline underline-offset-2";

interface DeleteAccountPageProps {
  justDeleted: boolean;
}

export default function DeleteAccountPage({
  justDeleted,
}: DeleteAccountPageProps) {
  const mailto = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(DELETION_EMAIL_SUBJECT)}`;

  return (
    <div className="min-h-dvh bg-white">
      <header className="from-brand-gradient-from via-brand-gradient-via to-brand-gradient-to relative overflow-hidden bg-gradient-to-br px-4 sm:px-6 lg:px-8">
        <GradientBackground />
        <div className="relative z-10 mx-auto max-w-3xl pt-6 pb-12 sm:pb-16">
          <Link
            href="/welcome"
            className="inline-flex items-center gap-2.5"
          >
            <Image
              src="/logo.png"
              alt=""
              width={32}
              height={32}
            />
            <span className="text-primary-main-dark text-lg font-semibold">
              {APP_NAME}
            </span>
          </Link>
          <h1 className="text-primary-main-dark mt-10 text-3xl font-bold tracking-tight sm:text-4xl">
            Delete your {APP_NAME} account
          </h1>
          <p className="text-text-secondary mt-4 max-w-2xl text-base sm:text-lg">
            This page explains how to delete your account in the{" "}
            <strong className="text-primary-main-dark">{APP_NAME}</strong> app,
            published by {DEVELOPER_NAME}, and what happens to your data when
            you do.
          </p>
        </div>
      </header>

      <main className="px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="relative z-10 -mt-6 mb-2 rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
            <DeleteAccountPanel justDeleted={justDeleted} />
          </div>

          <PolicySection
            id="in-app"
            title="Delete in the app"
          >
            <ol className="list-decimal space-y-2 pl-5">
              {IN_APP_STEPS.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
            <p>
              You are signed out straight away, and the app removes your account
              data from the phone.
            </p>
          </PolicySection>

          <PolicySection
            id="by-email"
            title="Can't open the app?"
          >
            <p>
              Email{" "}
              <a
                href={mailto}
                className={linkClass}
              >
                {SUPPORT_EMAIL}
              </a>{" "}
              from the email address on your account, with the subject{" "}
              <strong className="text-primary-main-dark">
                {DELETION_EMAIL_SUBJECT}
              </strong>
              . We will confirm the request by replying to that address, and
              delete the account within {EMAIL_DELETION_PERIOD}.
            </p>
          </PolicySection>

          <PolicySection
            id="deleted"
            title="What is deleted"
          >
            <DeletedDataList />
            <p>
              Deletion is{" "}
              <strong className="text-primary-main-dark">permanent</strong>.
              Unused credits are lost and cannot be restored.
            </p>
          </PolicySection>

          <PolicySection
            id="kept"
            title="What we keep, and for how long"
          >
            <p>
              We keep only what the law requires us to keep, and use it for
              nothing else:
            </p>
            <ul className="list-disc space-y-2 pl-5">
              {KEPT_RECORDS.map((record) => (
                <li key={record}>{record}</li>
              ))}
            </ul>
            {BACKUP_ROLLOVER_PERIOD && (
              <p>
                Server backups that contain your data are overwritten within{" "}
                {BACKUP_ROLLOVER_PERIOD}.
              </p>
            )}
          </PolicySection>

          <PolicySection
            id="other-controls"
            title="Other ways to control your data"
          >
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong className="text-primary-main-dark">
                  Disconnect one account
                </strong>{" "}
                without deleting everything: in the app, open Portfolio, open
                the connection and disconnect it. You can also revoke consents
                in the OneMoney app or website.
              </li>
              <li>
                <strong className="text-primary-main-dark">
                  Uninstall the app
                </strong>{" "}
                to remove everything it stored on your phone. Uninstalling does
                not delete your account.
              </li>
              <li>
                <strong className="text-primary-main-dark">
                  Ask what we hold, or correct it:
                </strong>{" "}
                email{" "}
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className={linkClass}
                >
                  {SUPPORT_EMAIL}
                </a>
                . See the{" "}
                <a
                  href={PRIVACY_URL}
                  className={linkClass}
                >
                  Privacy Policy
                </a>{" "}
                for your rights under the Digital Personal Data Protection Act,
                2023.
              </li>
            </ul>
          </PolicySection>

          <PolicySection
            id="contact"
            title="Contact"
          >
            <address className="not-italic">
              Grievance Officer: {GRIEVANCE_OFFICER},{" "}
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className={linkClass}
              >
                {SUPPORT_EMAIL}
              </a>
              <br />
              {DEVELOPER_NAME}, {REGISTERED_ADDRESS}
            </address>
          </PolicySection>
        </div>
      </main>

      <WelcomeFooter />
    </div>
  );
}
