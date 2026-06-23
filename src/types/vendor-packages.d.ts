declare module "react-resizable-panels" {
  import type * as React from "react";

  export const Group: React.ComponentType<any>;
  export const Panel: React.ComponentType<any>;
  export const Separator: React.ComponentType<any>;
}

declare module "react-hook-form" {
  import type * as React from "react";

  export type FieldValues = Record<string, unknown>;
  export type FieldPath<TFieldValues extends FieldValues = FieldValues> = Extract<keyof TFieldValues, string> | string;
  export type ControllerProps<
    TFieldValues extends FieldValues = FieldValues,
    TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  > = {
    name: TName;
    [key: string]: unknown;
  };

  export const Controller: React.ComponentType<ControllerProps>;
  export const FormProvider: React.ComponentType<Record<string, unknown>>;
  export function useFormContext(): {
    formState: Record<string, unknown>;
    getFieldState: (name: string, formState: Record<string, unknown>) => {
      error?: { message?: string };
    };
  };
}
