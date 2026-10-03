"use client";

import {
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "../components/ui/sheet";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { useAuth } from "@clerk/nextjs";
import { useMutation } from "@tanstack/react-query";
import { UserFormSchema } from "@repo/types";
import { toast } from "react-toastify";

const ADD_USER_FORM_ID = "add-user-form";

const AddUser = () => {
  const form = useForm<z.infer<typeof UserFormSchema>>({
    resolver: zodResolver(UserFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      emailAddress: [],
      username: "",
      password: "",
    },
  });

  const { getToken } = useAuth();

  const mutation = useMutation({
    mutationFn: async (data: z.infer<typeof UserFormSchema>) => {
      const token = await getToken();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_AUTH_SERVICE_URL}/users`,
        {
          method: "POST",
          body: JSON.stringify(data),
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (!res.ok) {
        throw new Error("Failed to create user!");
      }
    },
    onSuccess: () => {
      toast.success("User created successfully");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return (
    // flex column filling the sheet's height, so the middle section
    // (the fields) can be given its own scroll area while the header
    // and footer (with the submit button) stay fixed in place.
    <SheetContent className="flex flex-col gap-0 p-0">
      <SheetHeader>
        <SheetTitle className="mb-1">Add User</SheetTitle>
        <SheetDescription>
          Fill in the details for the new user.
        </SheetDescription>
      </SheetHeader>

      {/* Scrollable field area. flex-1 lets it take the remaining height,
          overflow-y-auto is what actually enables scrolling when content
          (validation messages, long email lists, etc.) grows past the
          visible height. min-h-0 is required for flex children to shrink
          below their content size instead of overflowing the flex parent. */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4">
        <Form {...form}>
          <form
            id={ADD_USER_FORM_ID}
            className="space-y-8 py-4"
            onSubmit={form.handleSubmit((data) => mutation.mutate(data))}
          >
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormDescription>Enter user first name.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormDescription>Enter user last name.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormDescription>Enter username.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="emailAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Addresses</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="email1@gmail.com, email2@gmail.com"
                      onChange={(e) => {
                        const emails = e.target.value
                          .split(",")
                          .map((email) => email.trim())
                          .filter((email) => email);
                        field.onChange(emails);
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    Only admin can see your email.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input {...field} type="password" />
                  </FormControl>
                  <FormDescription>Enter user password.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </div>

      {/* Outside the scroll area, so the button is always visible
          regardless of how tall the field list gets. `form` attribute
          ties it to the form above even though it's rendered outside it. */}
      <SheetFooter className="border-t">
        <Button
          type="submit"
          form={ADD_USER_FORM_ID}
          disabled={mutation.isPending}
          className="disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {mutation.isPending ? "Submitting..." : "Submit"}
        </Button>
      </SheetFooter>
    </SheetContent>
  );
};

export default AddUser;
