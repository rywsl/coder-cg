import * as Yup from "yup";
import type { UpdateTemplateMeta } from "#/api/typesGenerated";
import { i18n } from "#/i18n";
import type {
	TemplateAutostartRequirementDaysValue,
	TemplateAutostopRequirementDaysValue,
} from "#/utils/schedule";

export interface TemplateScheduleFormValues
	extends Omit<
		UpdateTemplateMeta,
		"autostop_requirement" | "autostart_requirement"
	> {
	autostart_requirement_days_of_week: TemplateAutostartRequirementDaysValue[];
	autostop_requirement_days_of_week: TemplateAutostopRequirementDaysValue;
	autostop_requirement_weeks: number;
	failure_cleanup_enabled: boolean;
	inactivity_cleanup_enabled: boolean;
	dormant_autodeletion_cleanup_enabled: boolean;
}

const MAX_TTL_DAYS = 30;

export const getValidationSchema = (): Yup.AnyObjectSchema =>
	Yup.object({
		default_ttl_ms: Yup.number()
			.integer(
				i18n.t(
					"templates:TemplateSettingsPage.TemplateSchedulePage.formHelpers.default_time_until_autostop_must_be_an_integer_061519c4",
				),
			)
			.required()
			.min(
				0,
				i18n.t(
					"templates:TemplateSettingsPage.TemplateSchedulePage.formHelpers.default_time_until_autostop_must_not_be_less_tha_67d7b9b7",
				),
			)
			.max(
				24 * MAX_TTL_DAYS,
				i18n.t(
					"templates:TemplateSettingsPage.TemplateSchedulePage.formHelpers.please_enter_a_limit_that_is_less_than_or_equal__8a950140",
				),
			),
		activity_bump_ms: Yup.number()
			.integer(
				i18n.t(
					"templates:TemplateSettingsPage.TemplateSchedulePage.formHelpers.activity_bump_must_be_an_integer_6f5b0cf8",
				),
			)
			.required()
			.min(
				0,
				i18n.t(
					"templates:TemplateSettingsPage.TemplateSchedulePage.formHelpers.activity_bump_must_not_be_less_than_0_2755accb",
				),
			)
			.max(
				24 * MAX_TTL_DAYS,
				i18n.t(
					"templates:TemplateSettingsPage.TemplateSchedulePage.formHelpers.please_enter_an_activity_bump_duration_that_is_l_d25e7eae",
				),
			),
		time_til_autostop_notify_ms: Yup.number()
			.integer(
				i18n.t(
					"templates:TemplateSettingsPage.TemplateSchedulePage.formHelpers.autostop_reminder_must_be_an_integer_6df13058",
				),
			)
			.required()
			.min(
				0,
				i18n.t(
					"templates:TemplateSettingsPage.TemplateSchedulePage.formHelpers.autostop_reminder_must_not_be_less_than_0_6a846d40",
				),
			)
			.max(
				24 * MAX_TTL_DAYS,
				i18n.t(
					"templates:TemplateSettingsPage.TemplateSchedulePage.formHelpers.autostop_reminder_must_not_exceed_720_hours_30_d_2432c436",
				),
			),
		failure_ttl_ms: Yup.number()
			.integer(
				i18n.t(
					"templates:TemplateSettingsPage.TemplateSchedulePage.formHelpers.failure_cleanup_days_must_be_an_integer_e948b52b",
				),
			)
			.required()
			.min(
				0,
				i18n.t(
					"templates:TemplateSettingsPage.TemplateSchedulePage.formHelpers.failure_cleanup_days_must_not_be_less_than_0_9b7f64fa",
				),
			)
			.test(
				"positive-if-enabled",
				i18n.t(
					"templates:TemplateSettingsPage.TemplateSchedulePage.formHelpers.failure_cleanup_days_must_be_greater_than_zero_w_c2e39780",
				),
				function (value) {
					const parent = this.parent as TemplateScheduleFormValues;
					if (!parent.failure_cleanup_enabled) {
						return true;
					}
					return Boolean(value);
				},
			),
		time_til_dormant_ms: Yup.number()
			.integer(
				i18n.t(
					"templates:TemplateSettingsPage.TemplateSchedulePage.formHelpers.dormancy_threshold_must_be_an_integer_5772fabd",
				),
			)
			.required()
			.min(
				0,
				i18n.t(
					"templates:TemplateSettingsPage.TemplateSchedulePage.formHelpers.dormancy_threshold_must_not_be_less_than_0_a984cd38",
				),
			)
			.test(
				"positive-if-enabled",
				i18n.t(
					"templates:TemplateSettingsPage.TemplateSchedulePage.formHelpers.dormancy_threshold_must_be_greater_than_zero_whe_a56bae1c",
				),
				function (value) {
					const parent = this.parent as TemplateScheduleFormValues;
					if (parent.inactivity_cleanup_enabled) {
						return Boolean(value);
					}
					return true;
				},
			),
		time_til_dormant_autodelete_ms: Yup.number()
			.integer(
				i18n.t(
					"templates:TemplateSettingsPage.TemplateSchedulePage.formHelpers.dormancy_auto_deletion_days_must_be_an_integer_1fc2ef3d",
				),
			)
			.required()
			.min(
				0,
				i18n.t(
					"templates:TemplateSettingsPage.TemplateSchedulePage.formHelpers.dormancy_auto_deletion_days_must_not_be_less_tha_c371b050",
				),
			)
			.test(
				"positive-if-enabled",
				i18n.t(
					"templates:TemplateSettingsPage.TemplateSchedulePage.formHelpers.dormancy_auto_deletion_days_must_be_greater_than_548fed7e",
				),
				function (value) {
					const parent = this.parent as TemplateScheduleFormValues;
					if (parent.dormant_autodeletion_cleanup_enabled) {
						return Boolean(value);
					}
					return true;
				},
			),
		allow_user_autostart: Yup.boolean(),
		allow_user_autostop: Yup.boolean(),

		autostop_requirement_days_of_week: Yup.string().required(),
		autostart_requirement_days_of_week: Yup.array().of(Yup.string()).required(),
		autostop_requirement_weeks: Yup.number().required().min(1).max(16),
	});
