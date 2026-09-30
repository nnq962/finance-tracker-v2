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
        'relative isolate inline-grid w-fit grid-flow-col auto-cols-fr items-center justify-center gap-1 rounded-[14px] bg-[#e7e4dd] p-1 dark:bg-[#44424a]',
        className,
      )}
      {...props}
    >
      {tabValues.length > 0 && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-1 left-1 z-0 rounded-[10px] bg-white shadow-[0_3px_0_#d6d2c8] transition-transform duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] [backface-visibility:hidden] [contain:paint] [will-change:transform] motion-reduce:duration-0 dark:bg-[#36333d] dark:shadow-[0_3px_0_#25232b]"
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
        "relative z-10 inline-flex w-full min-w-0 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-[10px] border-0 px-4 pt-[11px] pb-[9px] font-heading text-xs leading-none font-extrabold tracking-[0.06em] uppercase text-[#8f8b98] transition-colors duration-150 hover:text-[#2b2a33] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[oklch(0.74_0.14_235)] data-[state=active]:text-[oklch(0.58_0.14_240)] disabled:pointer-events-none disabled:opacity-50 dark:text-[#a6a1af] dark:hover:text-white dark:data-[state=active]:text-[#71caff] [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
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
