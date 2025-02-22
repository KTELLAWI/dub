import {
  Dispatch,
  SetStateAction,
  useCallback,
  useMemo,
  useState,
} from "react";
import Modal from "@/components/shared/modal";
import Button from "#/ui/button";
import { useRouter } from "next/router";
import Link from "next/link";
import { motion } from "framer-motion";
import { STAGGER_CHILD_VARIANTS } from "#/lib/constants";
import { CheckCircleFill } from "@/components/shared/icons";
import { capitalize } from "#/lib/utils";
import { PLANS } from "#/lib/stripe/utils";
import { getStripe } from "#/lib/stripe/client";
import Badge from "#/ui/badge";
import Confetti from "react-dom-confetti";

function UpgradePlanModal({
  showUpgradePlanModal,
  setShowUpgradePlanModal,
  welcomeFlow,
}: {
  showUpgradePlanModal: boolean;
  setShowUpgradePlanModal: Dispatch<SetStateAction<boolean>>;
  welcomeFlow?: boolean;
}) {
  const router = useRouter();
  const { slug } = router.query;
  const [plan, setPlan] = useState<"Pro" | "Enterprise">("Pro");
  const [period, setPeriod] = useState<"monthly" | "yearly">("yearly");
  const features = useMemo(() => {
    return [
      `Track ${
        plan === "Enterprise" ? "unlimited" : "50x more"
      } link clicks per month`,
      "Unlimited custom domains",
      "Unlimited team members",
      "Unlimited link history",
      "Redirect your root domain",
      "Custom QR Code logo",
      ...(plan === "Enterprise" ? ["SSO/SAML", "Priority support"] : []),
    ];
  }, [plan]);
  const [clicked, setClicked] = useState(false);
  return (
    <Modal
      showModal={showUpgradePlanModal}
      setShowModal={setShowUpgradePlanModal}
      closeWithX={welcomeFlow}
    >
      <div className="inline-block w-full transform overflow-hidden bg-white align-middle shadow-xl transition-all sm:max-w-lg sm:rounded-2xl sm:border sm:border-gray-200">
        <motion.div
          variants={{
            show: {
              transition: {
                staggerChildren: 0.15,
              },
            },
          }}
          initial="hidden"
          animate="show"
          className="flex flex-col items-center justify-center space-y-3 border-b border-gray-200 px-4 py-8 sm:px-16"
        >
          <motion.img
            src="/_static/logo.png"
            alt="Dub logo"
            className="h-10 w-10 rounded-full border border-gray-200"
            width={20}
            height={20}
            variants={STAGGER_CHILD_VARIANTS}
          />
          <motion.h3
            className="text-lg font-medium"
            variants={STAGGER_CHILD_VARIANTS}
          >
            Upgrade to {plan}
          </motion.h3>
          <motion.p
            className="text-center text-sm text-gray-500"
            variants={STAGGER_CHILD_VARIANTS}
          >
            Enjoy higher limits and extra features with our {plan} plan.
          </motion.p>
        </motion.div>
        <div className="bg-gray-50 px-4 py-8 text-left sm:px-16">
          <motion.div
            className="flex flex-col space-y-3"
            variants={STAGGER_CHILD_VARIANTS}
            initial="hidden"
            animate="show"
          >
            <div className="mb-4">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <h4 className="font-medium text-gray-900">
                    {plan} {capitalize(period)}
                  </h4>
                  <Badge
                    text={`$${
                      PLANS.find((p) => p.name === plan)!.price[period].amount
                    }/${period.replace("ly", "")}`}
                    variant="neutral"
                    className="text-sm font-normal normal-case"
                  />
                </div>
                <Confetti
                  active={period === "yearly"}
                  config={{ elementCount: 200, spread: 90 }}
                />
                <button
                  onClick={() => {
                    setPeriod(period === "monthly" ? "yearly" : "monthly");
                  }}
                  className="text-xs text-gray-500 underline underline-offset-4 transition-colors hover:text-gray-800"
                >
                  {period === "monthly"
                    ? "Get 2 months free 🎁"
                    : "Switch to monthly"}
                </button>
              </div>
              <motion.div
                variants={{
                  show: {
                    transition: {
                      staggerChildren: 0.08,
                    },
                  },
                }}
                initial="hidden"
                animate="show"
                className="flex flex-col space-y-2"
              >
                {features.map((feature, i) => (
                  <motion.div
                    key={i}
                    variants={STAGGER_CHILD_VARIANTS}
                    className="flex items-center space-x-2 text-sm text-gray-500"
                  >
                    <CheckCircleFill className="h-5 w-5 text-green-500" />
                    <span>{feature}</span>
                  </motion.div>
                ))}
              </motion.div>
            </div>
            <Button
              text={`Upgrade to ${plan} ${capitalize(period)}`}
              loading={clicked}
              onClick={() => {
                setClicked(true);
                fetch(
                  `/api/projects/${slug}/billing/upgrade?priceId=${
                    PLANS.find((p) => p.name === plan)!.price[period].priceIds[
                      process.env.NEXT_PUBLIC_VERCEL_ENV === "production"
                        ? "production"
                        : "test"
                    ]
                  }`,
                  {
                    method: "POST",
                  },
                )
                  .then(async (res) => {
                    const data = await res.json();
                    const { id: sessionId } = data;
                    const stripe = await getStripe();
                    stripe?.redirectToCheckout({ sessionId });
                  })
                  .catch((err) => {
                    alert(err);
                    setClicked(false);
                  });
              }}
            />
            {welcomeFlow ? (
              <Link
                href={`/${slug}`}
                className="text-center text-xs text-gray-500 underline underline-offset-4 transition-colors hover:text-gray-800"
              >
                Skip for now
              </Link>
            ) : (
              <div className="flex items-center justify-center space-x-2">
                <button
                  onClick={() => {
                    setPlan(plan === "Pro" ? "Enterprise" : "Pro");
                  }}
                  className="text-center text-xs text-gray-500 underline-offset-4 transition-all hover:text-gray-800 hover:underline"
                >
                  Dub {plan === "Pro" ? "Enterprise" : "Pro"}
                </button>
                <p className="text-gray-500">•</p>
                <a
                  href="https://dub.sh/pricing"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-center text-xs text-gray-500 underline-offset-4 transition-all hover:text-gray-800 hover:underline"
                >
                  Compare plans
                </a>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </Modal>
  );
}

export function useUpgradePlanModal({
  welcomeFlow,
}: { welcomeFlow?: boolean } = {}) {
  const [showUpgradePlanModal, setShowUpgradePlanModal] = useState(false);

  const UpgradePlanModalCallback = useCallback(() => {
    return (
      <UpgradePlanModal
        showUpgradePlanModal={showUpgradePlanModal}
        setShowUpgradePlanModal={setShowUpgradePlanModal}
        welcomeFlow={welcomeFlow}
      />
    );
  }, [showUpgradePlanModal, setShowUpgradePlanModal, welcomeFlow]);

  return useMemo(
    () => ({
      setShowUpgradePlanModal,
      UpgradePlanModal: UpgradePlanModalCallback,
    }),
    [setShowUpgradePlanModal, UpgradePlanModalCallback],
  );
}
