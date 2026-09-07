import type { FC, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#/components/Dialog/Dialog";
import { Link } from "#/components/Link/Link";

interface RequirePermissionProps {
	children?: ReactNode;
	isFeatureVisible: boolean;
}

/**
 * Wraps routes that are available based on RBAC or licensing.
 */
export const RequirePermission: FC<RequirePermissionProps> = ({
	children,
	isFeatureVisible,
}) => {
	const { t: tI18n } = useTranslation("components");

	if (!isFeatureVisible) {
		return (
			<Dialog open>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							{tI18n(
								"permissions.RequirePermission.you_don_t_have_permission_to_view_this_page_99d2f046",
							)}
						</DialogTitle>
					</DialogHeader>
					<DialogDescription>
						{tI18n(
							"permissions.RequirePermission.if_you_believe_this_is_a_mistake_please_contact__c519a6f1",
						)}
					</DialogDescription>
					<DialogFooter>
						<Link href="/">
							{tI18n("permissions.RequirePermission.go_to_workspaces_38ce977a")}
						</Link>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		);
	}

	return children;
};
