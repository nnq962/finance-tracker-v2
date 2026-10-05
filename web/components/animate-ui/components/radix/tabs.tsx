'use client';

import * as React from 'react';

import {
  Tabs as TabsPrimitive,
  TabsList as TabsListPrimitive,
  TabsTrigger as TabsTriggerPrimitive,
  TabsContent as TabsContentPrimitive,
  TabsContents as TabsContentsPrimitive,
  type TabsProps as TabsPrimitiveProps,
  type TabsListProps as TabsListPrimitiveProps,
  type TabsTriggerProps as TabsTriggerPrimitiveProps,
  type TabsContentProps as TabsContentPrimitiveProps,
  type TabsContentsProps as TabsContentsPrimitiveProps,
} from '@/components/animate-ui/primitives/radix/tabs';
import { useControlledState } from '@/hooks/use-controlled-state';
import { cn } from '@/lib/utils';

type TabsProps = TabsPrimitiveProps;

type TabsVisualContextValue = {
  value: string | undefined;
};

const TabsVisualContext = React.createContext<TabsVisualContextValue | null>(
  null,
);

function Tabs({
  className,
  value: controlledValue,
  defaultValue,
  onValueChange,
  ...props
}: TabsProps) {
  const [internalValue, setValue] = useControlledState({
    value: controlledValue,
    defaultValue,
    onChange: onValueChange,
  });
  const value = controlledValue ?? internalValue;

  return (
    <TabsVisualContext.Provider value={{ value }}>
      <TabsPrimitive
        className={cn('flex flex-col gap-2', className)}
        value={value}
        onValueChange={setValue}
        {...props}
      />
    </TabsVisualContext.Provider>
  );
}

type TabsListProps = TabsListPrimitiveProps;

function getTabValues(children: React.ReactNode): string[] {
  const values: string[] = [];

  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;

    if (child.type === React.Fragment) {
      const fragmentProps = child.props as { children?: React.ReactNode };
      getTabValues(fragmentProps.children).forEach((value) =>
        values.push(value),
      );
      return;
    }

    const value = (child.props as { value?: unknown }).value;
    if (typeof value === 'string') values.push(value);
  });

  return values;
}

function TabsList({ className, children, ...props }: TabsListProps) {
  const context = React.useContext(TabsVisualContext);
  const tabValues = getTabValues(children);
  const tabCount = Math.max(tabValues.length, 1);
  const activeIndex = Math.max(tabValues.indexOf(context?.value ?? ''), 0);
  const gapRem = 0.25;
  const totalGapRem = (tabCount - 1) * gapRem;

  return (
    <TabsListPrimitive
      className={cn(
        'relative isolate inline-grid w-fit grid-flow-col auto-cols-fr items-center justify-center gap-1 rounded-full bg-secondary p-1',
        className,
      )}
      {...props}
    >
      {tabValues.length > 0 && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-1 left-1 z-0 rounded-full bg-card shadow-[0_1px_3px_rgb(0_0_0/0.08),0_1px_1px_rgb(0_0_0/0.04)] transition-transform duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] [backface-visibility:hidden] [contain:paint] [will-change:transform] motion-reduce:duration-0 dark:bg-white/16"
          style={{
            width: `calc((100% - 0.5rem - ${totalGapRem}rem) / ${tabCount})`,
            transform: `translate3d(calc(${activeIndex * 100}% + ${activeIndex * gapRem}rem), 0, 0)`,
          }}
        />
      )}
      {children}
    </TabsListPrimitive>
  );
}

type TabsTriggerProps = TabsTriggerPrimitiveProps;

function TabsTrigger({ className, ...props }: TabsTriggerProps) {
  return (
    <TabsTriggerPrimitive
      className={cn(
        "relative z-10 inline-flex h-9 w-full min-w-0 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-full border-0 px-4 font-sans text-sm font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40 data-[state=active]:text-foreground disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    />
  );
}

type TabsContentsProps = TabsContentsPrimitiveProps;

function TabsContents(props: TabsContentsProps) {
  return <TabsContentsPrimitive {...props} />;
}

type TabsContentProps = TabsContentPrimitiveProps;

function TabsContent({ className, ...props }: TabsContentProps) {
  return (
    <TabsContentPrimitive
      className={cn('flex-1 outline-none', className)}
      {...props}
    />
  );
}

export {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContents,
  TabsContent,
  type TabsProps,
  type TabsListProps,
  type TabsTriggerProps,
  type TabsContentsProps,
  type TabsContentProps,
};
