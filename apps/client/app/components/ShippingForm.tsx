"use client";

import {
  DELIVERY_CITIES,
  DELIVERY_CITY_INFO,
  PICKUP_STATION,
  ShippingFormInputs,
  shippingFormSchema,
} from "@repo/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth, useUser } from "@clerk/nextjs";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import useCheckoutStore from "../stores/storeCheckout";
import {
  fetchCheckoutDetails,
  saveCheckoutDetails,
  toShippingForm,
} from "../api/svc/payment/paymentApi";
import { formatUGX } from "../lib/checkout";
import { startLoader } from "./NavigationProgress";

const EMPTY_FORM: ShippingFormInputs = {
  name: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  deliveryMethod: "pickup",
  deliveryCity: "lira",
};

const CHEAPEST_DELIVERY = Math.min(
  ...DELIVERY_CITIES.map((city) => DELIVERY_CITY_INFO[city].fee),
);

// text-base on phones stops iOS zooming into the field; smaller on desktop.
const inputClass =
  "w-full border-b border-gray-200 bg-transparent py-2 text-base outline-none sm:text-sm";

const Field = ({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: ReactNode;
}) => (
  <div className="flex flex-col gap-1">
    <label htmlFor={id} className="text-xs font-medium text-gray-500">
      {label}
    </label>
    {children}
    {error && <p className="text-xs text-red-500">{error}</p>}
  </div>
);

const ShippingForm = () => {
  const router = useRouter();
  const { getToken } = useAuth();
  const { user } = useUser();

  const savedShipping = useCheckoutStore((state) => state.shipping);
  const setShipping = useCheckoutStore((state) => state.setShipping);
  const setDelivery = useCheckoutStore((state) => state.setDelivery);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ShippingFormInputs>({
    resolver: zodResolver(shippingFormSchema),
    defaultValues: savedShipping ?? EMPTY_FORM,
  });

  const deliveryMethod = watch("deliveryMethod");
  const deliveryCity = watch("deliveryCity");
  const isDelivery = deliveryMethod === "delivery";

  // Don't overwrite what the customer is typing with slower-arriving data.
  const dirtyRef = useRef(false);
  useEffect(() => {
    dirtyRef.current = isDirty;
  }, [isDirty]);

  // Pre-fill: the details they saved last time, else their account name/email.
  useEffect(() => {
    if (savedShipping) return;
    let cancelled = false;

    const prefill = async () => {
      try {
        const token = await getToken();
        const saved = token ? await fetchCheckoutDetails(token) : null;
        if (!cancelled && saved && !dirtyRef.current) {
          reset(toShippingForm(saved));
          return;
        }
      } catch (error) {
        console.error("Could not load saved delivery details:", error);
      }

      if (cancelled || dirtyRef.current) return;
      if (!getValues("name") && user?.fullName) {
        setValue("name", user.fullName);
      }
      if (!getValues("email") && user?.primaryEmailAddress) {
        setValue("email", user.primaryEmailAddress.emailAddress);
      }
    };

    void prefill();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the cart summary's delivery fee in step with the choice, live.
  useEffect(() => {
    setDelivery(deliveryMethod, deliveryCity);
  }, [deliveryMethod, deliveryCity, setDelivery]);

  // Address / city follow the choice:
  //   pickup            -> our station (the server forces this too)
  //   delivery + a city -> that city's name; customer types the street/area
  //   delivery + "other"-> customer types the town
  useEffect(() => {
    if (deliveryMethod === "pickup") {
      setValue("address", PICKUP_STATION.address);
      setValue("city", PICKUP_STATION.city);
      return;
    }

    if (getValues("address") === PICKUP_STATION.address) {
      setValue("address", "");
    }

    if (deliveryCity === "other") {
      const current = getValues("city");
      const isListedCity =
        current === PICKUP_STATION.city ||
        DELIVERY_CITIES.some(
          (key) => key !== "other" && DELIVERY_CITY_INFO[key].label === current,
        );
      if (isListedCity) setValue("city", "");
    } else {
      setValue("city", DELIVERY_CITY_INFO[deliveryCity].label);
    }
  }, [deliveryMethod, deliveryCity, setValue, getValues]);

  const onSubmit: SubmitHandler<ShippingFormInputs> = async (data) => {
    setSubmitError(null);

    try {
      const token = await getToken();
      if (!token) throw new Error("You need to be signed in.");

      // Saved on the server: this is what the payment service reads when
      // payment starts, and what ends up on the order.
      const saved = await saveCheckoutDetails(token, data);
      setShipping(toShippingForm(saved));
    } catch (error) {
      console.error("Saving delivery details failed:", error);
      setSubmitError(
        error instanceof Error && error.message
          ? error.message
          : "We couldn't save your delivery details. Please try again.",
      );
      return;
    }

    startLoader();
    router.push("/cart/payment");
  };

  const options = [
    {
      value: "pickup" as const,
      title: "Pick up from our station",
      hint: "Free · ready within a few hours",
    },
    {
      value: "delivery" as const,
      title: "Delivery to my address",
      hint: `From ${formatUGX(CHEAPEST_DELIVERY)}, by city`,
    },
  ];

  return (
    <form className="flex flex-col gap-5" onSubmit={handleSubmit(onSubmit)}>
      {/* HOW TO GET IT */}
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-xs font-medium text-gray-500">
          How would you like to get your order?
        </legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {options.map((option) => (
            <label
              key={option.value}
              className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                deliveryMethod === option.value
                  ? "border-gray-800 bg-gray-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <input
                type="radio"
                value={option.value}
                className="mt-1 accent-gray-800"
                {...register("deliveryMethod")}
              />
              <span className="flex min-w-0 flex-col">
                <span className="text-sm font-medium">{option.title}</span>
                <span className="text-xs text-gray-500">{option.hint}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* CONTACT */}
      <Field id="name" label="Name" error={errors.name?.message}>
        <input
          className={inputClass}
          type="text"
          id="name"
          autoComplete="name"
          placeholder="John Doe"
          {...register("name")}
        />
      </Field>
      <Field id="email" label="Email" error={errors.email?.message}>
        <input
          className={inputClass}
          type="email"
          id="email"
          autoComplete="email"
          placeholder="johndoe@gmail.com"
          {...register("email")}
        />
      </Field>
      <Field id="phone" label="Phone" error={errors.phone?.message}>
        <input
          className={inputClass}
          type="tel"
          id="phone"
          inputMode="numeric"
          autoComplete="tel-national"
          placeholder="0772123456"
          {...register("phone")}
        />
      </Field>

      {isDelivery ? (
        <>
          {/* DELIVERY ADDRESS */}
          <Field
            id="deliveryCity"
            label="Delivery city"
            error={errors.deliveryCity?.message}
          >
            <select
              id="deliveryCity"
              className={inputClass}
              {...register("deliveryCity")}
            >
              {DELIVERY_CITIES.map((key) => (
                <option key={key} value={key}>
                  {DELIVERY_CITY_INFO[key].label} -{" "}
                  {formatUGX(DELIVERY_CITY_INFO[key].fee)}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500">
              Usually {DELIVERY_CITY_INFO[deliveryCity].eta.toLowerCase()}.
              Heavy loads, like cement or iron sheets, may cost more - we will
              call you first if so.
            </p>
          </Field>

          {deliveryCity === "other" && (
            <Field id="city" label="Town" error={errors.city?.message}>
              <input
                className={inputClass}
                type="text"
                id="city"
                autoComplete="address-level2"
                placeholder="Which town?"
                {...register("city")}
              />
            </Field>
          )}

          <Field
            id="address"
            label="Street, area or landmark"
            error={errors.address?.message}
          >
            <input
              className={inputClass}
              type="text"
              id="address"
              autoComplete="street-address"
              placeholder="Plot 12, Main Street, near the market"
              {...register("address")}
            />
          </Field>
        </>
      ) : (
        <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
          <p className="font-medium text-gray-800">Collect from:</p>
          <p>
            {PICKUP_STATION.address}, {PICKUP_STATION.city}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            We will message you when your order is ready.
          </p>
        </div>
      )}

      {submitError && <p className="text-sm text-red-500">{submitError}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-gray-800 p-2.5 text-white transition-all duration-300 hover:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Saving..." : "Continue to payment"}
        {!isSubmitting && <ArrowRight className="h-3 w-3" />}
      </button>
    </form>
  );
};

export default ShippingForm;
