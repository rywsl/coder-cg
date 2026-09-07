import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";
import { createContext, type FC, useContext } from "react";
import { useTranslation } from "react-i18next";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "#/components/Tooltip/Tooltip";

const statusIndicatorVariants = cva(
	"font-medium inline-flex items-center gap-2",
	{
		variants: {
			variant: {
				success: "text-content-success",
				failed: "text-content-destructive",
				inactive: "text-content-secondary",
				warning: "text-content-warning",
				pending: "text-highlight-sky",
			},
			size: {
				sm: "text-xs",
				md: "text-sm",
			},
		},
		defaultVariants: {
			variant: "success",
			size: "md",
		},
	},
);

type StatusIndicatorContextValue = VariantProps<typeof statusIndicatorVariants>;

const StatusIndicatorContext = createContext<StatusIndicatorContextValue>({});

export type StatusIndicatorProps = React.ComponentPropsWithRef<"div"> &
	StatusIndicatorContextValue;

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
	size,
	variant,
	className,
	...props
}) => {
	return (
		<StatusIndicatorContext.Provider value={{ size, variant }}>
			<div
				className={cn(statusIndicatorVariants({ variant, size }), className)}
				{...props}
			/>
		</StatusIndicatorContext.Provider>
	);
};

const dotVariants = cva("rounded-full inline-block border-4 border-solid", {
	variants: {
		variant: {
			success: "bg-content-success border-surface-green",
			failed: "bg-content-destructive border-surface-destructive",
			inactive: "bg-content-secondary border-surface-grey",
			warning: "bg-content-warning border-surface-orange",
			pending: "bg-highlight-sky border-surface-sky",
		},
		size: {
			sm: "size-3 border-4",
			md: "size-4 border-4",
		},
	},
	defaultVariants: {
		variant: "success",
		size: "md",
	},
});

interface StatusIndicatorDotProps
	extends React.HTMLAttributes<HTMLDivElement>,
		VariantProps<typeof dotVariants> {}

export const StatusIndicatorDot: FC<StatusIndicatorDotProps> = ({
	className,
	// We allow the size and variant to be overridden directly by the component.
	// This allows StatusIndicatorDot to be used alone.
	size,
	variant,
	...props
}) => {
	const { size: ctxSize, variant: ctxVariant } = useContext(
		StatusIndicatorContext,
	);

	return (
		<div
			className={cn(
				dotVariants({ variant: variant ?? ctxVariant, size: size ?? ctxSize }),
				className,
			)}
			{...props}
		/>
	);
};

interface StatusHealthyIndicatorProps {
	derpOnly?: boolean;
}

export const StatusHealthyIndicator: FC<StatusHealthyIndicatorProps> = ({
	derpOnly,
}: StatusHealthyIndicatorProps) => {
	const { t: tI18n } = useTranslation("components");

	return (
		<StatusIndicator variant="success">
			<StatusIndicatorDot />
			{derpOnly
				? tI18n("StatusIndicator.StatusIndicator.healthy_derp_only_5cb8279a")
				: tI18n("StatusIndicator.StatusIndicator.healthy_7f1e323b")}
		</StatusIndicator>
	);
};

export const StatusNotHealthyIndicator: FC = () => {
	const { t: tI18n } = useTranslation("components");

	return (
		<StatusIndicator variant="failed">
			<StatusIndicatorDot />
			{tI18n("StatusIndicator.StatusIndicator.unhealthy_317b1fbc")}
		</StatusIndicator>
	);
};

export const StatusNotRegisteredIndicator: FC = () => {
	const { t: tI18n } = useTranslation("components");

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<StatusIndicator variant="warning">
					<StatusIndicatorDot />
					{tI18n("StatusIndicator.StatusIndicator.never_seen_5b9c95c2")}
				</StatusIndicator>
			</TooltipTrigger>
			<TooltipContent>
				{tI18n(
					"StatusIndicator.StatusIndicator.workspace_proxy_has_never_come_online_and_needs__10df83c0",
				)}
			</TooltipContent>
		</Tooltip>
	);
};

export const StatusNotReachableIndicator: FC = () => {
	const { t: tI18n } = useTranslation("components");

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<StatusIndicator variant="warning">
					<StatusIndicatorDot />
					{tI18n("StatusIndicator.StatusIndicator.not_reachable_5ad99230")}
				</StatusIndicator>
			</TooltipTrigger>
			<TooltipContent>
				{tI18n(
					"StatusIndicator.StatusIndicator.workspace_proxy_not_responding_to_http_s_request_42d029d4",
				)}
			</TooltipContent>
		</Tooltip>
	);
};
