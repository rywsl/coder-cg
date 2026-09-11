#!/usr/bin/env node

import { createHash } from "node:crypto";
import {
	existsSync,
	readdirSync,
	readFileSync,
	statSync,
	writeFileSync,
} from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import recast from "recast";
import babelTSParser from "recast/parsers/babel-ts.js";

const { builders: b, namedTypes: n, visit } = recast.types;
const siteRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = join(siteRoot, "src");
const enCatalogPath = join(sourceRoot, "i18n/locales/en/generated.json");
const zhCatalogPath = join(sourceRoot, "i18n/locales/zh-CN/generated.json");
const write = process.argv.includes("--write");
const translate = process.argv.includes("--translate");
const fileArgument = process.argv.find((argument) => argument.startsWith("--file="));
const selectedFile = fileArgument
	? resolve(siteRoot, fileArgument.slice("--file=".length))
	: undefined;

if (translate && !write) {
	throw new Error("--translate requires --write");
}

const visibleAttributes = new Set([
	"alt",
	"aria-description",
	"aria-label",
	"ariaLabel",
	"buttonText",
	"cancelText",
	"caption",
	"confirmText",
	"description",
	"detail",
	"dialogTitle",
	"entity",
	"emptyMessage",
	"emptyText",
	"emptyTitle",
	"error",
	"errorMessage",
	"fallback",
	"features",
	"heading",
	"headerText",
	"helpText",
	"helperText",
	"inputLabel",
	"info",
	"label",
	"loadingText",
	"loadingLabel",
	"learnMoreLabel2",
	"note",
	"noOptionsText",
	"okText",
	"placeholder",
	"placeholderLabel",
	"payloadLabel",
	"removeLabel",
	"roleLabel",
	"progressLabel",
	"saveErrorMessage",
	"searchLabel",
	"searchPlaceholder",
	"searchResultsLabel",
	"subtitle",
	"summary",
	"switchLabel",
	"tableLabel",
	"title",
	"tooltip",
	"unavailableMessage",
	"unit",
	"unsetPlaceholder",
	"verb",
	"viewportAriaLabel",
	"copyLabel",
]);
const visibleObjectProperties = new Set([
	"caption",
	"description",
	"detail",
	"emptyMessage",
	"emptyText",
	"formError",
	"helperText",
	"label",
	"note",
	"placeholder",
	"progressLabel",
	"statusFallback",
	"subtitle",
	"summary",
	"title",
	"tooltip",
]);
const protectedElements = new Set([
	"code",
	"kbd",
	"Markdown",
	"pre",
	"samp",
	"script",
	"style",
	"SyntaxHighlighter",
]);
const protectedTerms = [
	"AWS Bedrock",
	"Azure OpenAI",
	"OpenAI",
	"OpenAI-compatible",
	"Anthropic",
	"DigitalOcean",
	"Google",
	"Google Cloud",
	"OpenRouter",
	"Vercel AI Gateway",
	"Subagent",
	"Subagents",
	"Visual Studio Code",
	"VS Code",
	"WebSocket",
	"JavaScript",
	"TypeScript",
	"Kubernetes",
	"Terraform",
	"JetBrains",
	"Geist Mono",
	"Fira Code",
	"JetBrains Mono",
	"Source Code Pro",
	"IBM Plex Mono",
	"GitHub Copilot",
	"GitHub",
	"Vercel",
	"Bedrock",
	"Bedrock Mantle",
	"Mantle",
	"InvokeModel",
	"Agents",
	"Agent",
	"Coder",
	"Premium",
	"AI",
	"OAuth",
	"OpenID",
	"Linux",
	"Windows",
	"macOS",
	"CLI",
	"API",
	"IDE",
	"SSH",
	"HTTP",
	"HTTPS",
	"SSE",
	"MCP",
	"Git",
	"Token",
	"Tokens",
	"Provisioners",
	"Provisioner",
	"LLM",
	"IdP",
	"SMTP",
	"Webhook",
	"Webpush",
	"WebAuthn",
	"JSON",
	"YAML",
	"UUID",
	"URL",
	"OIDC",
	"SCIM",
	"DERP",
	"RBAC",
	"JWT",
	"PKCE",
	"CPU",
	"GPU",
];
const exactTranslations = new Map([
	["1MB", "1MB"],
	["ALTITUDE", "高度"],
	["AM", "上午"],
	["Anthropic", "Anthropic"],
	["Active", "当前生效"],
	["Add", "添加"],
	["All", "全部"],
	["Apply", "应用"],
	["AWS Bedrock", "AWS Bedrock"],
	["Azure OpenAI", "Azure OpenAI"],
	["Back", "返回"],
	["Cancel", "取消"],
	["Clear", "清除"],
	["Close", "关闭"],
	["Confirm", "确认"],
	["Continue", "继续"],
	["CODERNAUTS", "Codernauts"],
	["Copy", "复制"],
	["Create", "创建"],
	["Delete", "删除"],
	["Deprecated", "已弃用"],
	["Description", "描述"],
	["Disabled", "已禁用"],
	["Dismiss", "关闭"],
	["Done", "完成"],
	["DigitalOcean", "DigitalOcean"],
	["Edit", "编辑"],
	["ENV", "环境变量"],
	["Enabled", "已启用"],
	["Error", "错误"],
	["FILE", "文件"],
	["Filter", "筛选"],
	["FUEL", "燃料"],
	["From", "从"],
	["Google", "Google"],
	["Google Cloud", "Google Cloud"],
	["HELP", "帮助"],
	["ID", "ID"],
	["IP:", "IP:"],
	["Loading", "正在加载"],
	["More", "更多"],
	["Name", "名称"],
	["N/A", "不适用"],
	["NAT-PMP", "NAT-PMP"],
	["Next", "下一步"],
	["No", "否"],
	["OK", "确定"],
	["Open", "打开"],
	["OpenAI", "OpenAI"],
	["OpenAI-compatible", "OpenAI 兼容"],
	["OpenRouter", "OpenRouter"],
	["Organization", "组织"],
	["Organizations", "组织"],
	["Onto the next base...", "前往下一个基地..."],
	["Owner", "所有者"],
	["OS:", "OS:"],
	["PCP", "PCP"],
	["PM", "下午"],
	["Previous", "上一步"],
	["PR", "PR"],
	["Provider", "提供商"],
	["Providers", "提供商"],
	["Provisioner Jobs", "Provisioner 任务"],
	["Provisioners", "Provisioner"],
	["Remove", "移除"],
	["Retry", "重试"],
	["Running", "运行中"],
	["Save", "保存"],
	["SAVED", "已保存"],
	["Saving", "正在保存"],
	["Search", "搜索"],
	["Select", "选择"],
	["Settings", "设置"],
	["Start", "启动"],
	["Stop", "停止"],
	["Submit", "提交"],
	["TLS", "TLS"],
	["Action", "操作"],
	["Actions", "操作"],
	["To", "至"],
	["Update", "更新"],
	["UDP", "UDP"],
	["USD", "USD"],
	["VELOCITY", "速度"],
	["Vercel AI Gateway", "Vercel AI Gateway"],
	["Vercel", "Vercel"],
	["GitHub Copilot", "GitHub Copilot"],
	["Mantle", "Mantle"],
	["InvokeModel", "InvokeModel"],
	["ms", "毫秒"],
	["YAW", "偏航"],
	["Yes", "是"],
]);
const translationCorrections = new Map([
	["you@company.com", "you@company.com"],
	["~/api-key.txt", "~/api-key.txt"],
	["{{value0}}: ---- unoccupied ----", "{{value0}}：---- 空闲 ----"],
	["Access key secret", "Secret Access Key"],
	["API key is required", "API 密钥为必填项"],
	["External ID", "外部 ID"],
	["Friendly name. Defaults to name if blank.", "显示名称。留空时默认使用名称。"],
	["Name is required", "名称为必填项"],
	[
		"Name must be lowercase, hyphen-separated (e.g. 'my-anthropic').",
		"名称必须使用小写字母并以连字符分隔（例如“my-anthropic”）。",
	],
	[
		"Find available Bedrock model IDs in the",
		"如需查看可用的 Bedrock 模型 ID，请参阅",
	],
	["Small-fast model", "小型快速模型"],
	["Small-fast model is required", "必须填写小型快速模型"],
	["Your updates haven't been saved. Leave anyway?", "更改尚未保存。仍要离开吗？"],
	["Subagent report", "Subagent 报告"],
	["CODERNAUTS", "Codernauts"],
	["Onto the next base...", "前往下一个基地..."],
	[
		"arn:aws:iam::123456789012:role/BedrockRole",
		"arn:aws:iam::123456789012:role/BedrockRole",
	],
	[
		"Endpoint must be a Bedrock mantle URL (https://bedrock-mantle.{region}.api.aws/anthropic).",
		"端点必须是 Bedrock Mantle URL (https://bedrock-mantle.{region}.api.aws/anthropic)。",
	],
	["Passwords must match", "两次输入的密码必须一致"],
	["Callback URL must be a valid URL.", "Callback URL 必须是有效的 URL。"],
	[
		"Must set at least one day of week if autostart is enabled.",
		"启用自动启动时，必须至少选择一周中的一天。",
	],
	[
		"Start time is required when autostart is enabled.",
		"启用自动启动时，必须填写启动时间。",
	],
	["Time must be in HH:mm format.", "时间必须采用 HH:mm 格式。"],
	["Invalid timezone.", "时区无效。"],
	[
		"Time until shutdown must be greater than zero when autostop is enabled.",
		"启用自动停止时，停止前等待时间必须大于零。",
	],
	[
		"Use kebab-case with lowercase letters, numbers, and single hyphens, up to 256 bytes.",
		"请使用由小写字母、数字和单个连字符组成的 kebab-case，最多 256 字节。",
	],
	["A skill with this name already exists.", "已存在同名 Skill。"],
	["Description must be 4096 bytes or smaller.", "描述不得超过 4096 字节。"],
	["Body is required.", "必须填写正文。"],
	["Cannot override owner tag", "不能覆盖 owner 标签"],
	[
		"Scope value must be 'organization' or 'user'",
		"scope 值必须为“organization”或“user”",
	],
	["Auto-archive days must be a whole number.", "自动归档天数必须为整数。"],
	["Debug retention days must be a whole number.", "调试保留天数必须为整数。"],
	["Retention days must be a whole number.", "保留天数必须为整数。"],
	["Duration must be greater than zero.", "持续时间必须大于零。"],
	["Context limit must be a positive integer.", "上下文限制必须为正整数。"],
	[
		"Compression threshold must be a number between 0 and 100.",
		"压缩阈值必须为 0 到 100 之间的数字。",
	],
	[
		"Members will fall back to another group's limit, or if no budgets have been set, they will have no spend limit.",
		"成员将回退到其他组的限额；如果未设置任何预算，则其支出不受限制。",
	],
	[
		"A $0 limit blocks AI access for members that aren't in another group with a budget set.",
		"$0 限额会阻止未加入其他已设置预算组的成员使用 AI。",
	],
	["/month, based on", "/月，基于"],
	[
		"Enter an amount between 0 and {{value0}}.",
		"请输入 0 到 {{value0}} 之间的金额。",
	],
	["/ Unlimited USD", "/ 无限额 USD"],
	[
		"Phone number should be in international format (e.g. +14155552671).",
		"电话号码应使用国际格式（例如 +14155552671）。",
	],
	[
		"Use lowercase letters and numbers with optional single hyphens between words.",
		"请使用小写字母和数字，单词之间可使用单个连字符。",
	],
	["Failed to parse chat stream update.", "无法解析聊天流更新。"],
	["Chat processing failed.", "聊天处理失败。"],
	["Failed to load plan", "无法加载计划"],
	[
		"File too large ({{value0}} MiB). Maximum is {{value1}} MiB.",
		"文件过大（{{value0}} MiB）。最大允许 {{value1}} MiB。",
	],
	["Enter a valid time, e.g. 09:30:00", "请输入有效时间，例如 09:30:00"],
	["End must be after start", "结束时间必须晚于开始时间"],
	["Failed to copy text to clipboard", "无法将文本复制到剪贴板"],
	[
		"You are approaching your AI Governance add-on seat limit.",
		"您即将达到 AI Governance 附加组件的席位上限。",
	],
	["An unknown error occurred.", "发生未知错误。"],
	["Open external URL", "打开外部 URL"],
	[
		"Enter both access key and secret, or leave both blank to use AWS environment credentials.",
		"请同时输入 Access Key 和 Secret，或将两者留空以使用 AWS 环境凭据。",
	],
	[
		"Your team has reached the Community license limit for active agents.",
		"您的团队已达到 Community 许可证的活跃 Agent 数量上限。",
	],
	[
		"Your team has reached your license’s limit for active agents.",
		"您的团队已达到许可证的活跃 Agent 数量上限。",
	],
	[
		"Your team has reached the {{value0}}-hour Agent Hours hard limit.",
		"您的团队已达到 {{value0}} 小时的 Agent Hours 硬性上限。",
	],
	[
		"Chat stream disconnected. Reconnecting…",
		"聊天流已断开。正在重新连接...",
	],
	["No agents match these filters", "没有符合这些筛选条件的 Agent"],
	["No archived agents", "没有已归档的 Agent"],
	["No agents yet", "尚无 Agent"],
	["unknown error", "未知错误"],
	[
		"This user's AI budget is managed by a group in another organization and isn't visible here.",
		"此用户的 AI 预算由另一个组织中的组管理，因此在此不可见。",
	],
	[
		"Please enter a description that is no longer than {{value0}} characters.",
		"请输入不超过 {{value0}} 个字符的描述。",
	],
	[
		"You have unpublished changes. Are you sure you want to leave?",
		"您有未发布的更改。确定要离开吗？",
	],
	["Unable to fetch workspace: {{value0}}", "无法获取 Workspace：{{value0}}"],
	[
		"Unable to fetch workspace agent: no agent found with ID, is the workspace started?",
		"无法获取 Workspace Agent：未找到对应 ID 的 Agent，Workspace 是否已启动？",
	],
	[
		"A workspace is your personal, customizable development environment.",
		"Workspace 是您的个人可定制开发环境。",
	],
	["Now", "现在"],
	["Never", "从未"],
	["{{value0}} must be a valid integer.", "{{value0}} 必须为有效的整数。"],
	["{{value0}} must be a valid number.", "{{value0}} 必须为有效的数字。"],
	["{{value0}} must be true or false.", "{{value0}} 必须为 true 或 false。"],
	["{{value0}} has an invalid value.", "{{value0}} 的值无效。"],
	[
		"Default reasoning effort must not exceed the max reasoning effort.",
		"默认推理强度不得超过最大推理强度。",
	],
	[
		"Invalid organization sync settings mapping structure",
		"组织同步设置的映射结构无效",
	],
	[
		"Please acknowledge the database requirements.",
		"请确认已了解数据库要求。",
	],
	[
		"Invalid group sync settings mapping structure",
		"组同步设置的映射结构无效",
	],
	[
		"Invalid role sync settings mapping structure",
		"角色同步设置的映射结构无效",
	],
	[
		"Default time until autostop must be an integer.",
		"默认自动停止等待时间必须为整数。",
	],
	["Activity bump must be an integer.", "活动延长时间必须为整数。"],
	["Autostop reminder must be an integer.", "自动停止提醒时间必须为整数。"],
	[
		"Failure cleanup days must be greater than zero when enabled.",
		"启用失败清理时，清理天数必须大于零。",
	],
	["Failure cleanup days must be an integer.", "失败清理天数必须为整数。"],
	[
		"Dormancy threshold must be greater than zero when enabled.",
		"启用休眠阈值时，阈值必须大于零。",
	],
	["Dormancy threshold must be an integer.", "休眠阈值必须为整数。"],
	[
		"Dormancy auto-deletion days must be greater than zero when enabled.",
		"启用休眠自动删除时，删除天数必须大于零。",
	],
	[
		"Dormancy auto-deletion days must be an integer.",
		"休眠自动删除天数必须为整数。",
	],
	["Password and confirmation must match", "密码与确认密码必须一致"],
	["Updating profile...", "正在更新个人资料..."],
	["Profile updated successfully.", "个人资料已更新。"],
	["Failed to update profile.", "无法更新个人资料。"],
	[
		"Value must only ever increase (last value was {{value0}})",
		"该值只能增加（上一个值为 {{value0}}）",
	],
	[
		"Value must only ever decrease (last value was {{value0}})",
		"该值只能减少（上一个值为 {{value0}}）",
	],
	["Adding {{value0}} to workspace...", "正在将 {{value0}} 添加到 Workspace..."],
	[
		"\"{{value0}}\" added to workspace successfully.",
		"已成功将“{{value0}}”添加到 Workspace。",
	],
	[
		"A startup script exited with an error. Check the agent logs for details.",
		"启动脚本因错误退出。请查看 Agent 日志了解详情。",
	],
	[
		"A startup script has exceeded the expected time. Check the agent logs for details.",
		"启动脚本已超过预期运行时间。请查看 Agent 日志了解详情。",
	],
	[
		"A shutdown script exited with an error. Check the agent logs for details.",
		"关闭脚本因错误退出。请查看 Agent 日志了解详情。",
	],
	[
		"A shutdown script has exceeded the expected time. Check the agent logs for details.",
		"关闭脚本已超过预期运行时间。请查看 Agent 日志了解详情。",
	],
	[
		"The workspace agent has not connected yet. Wait for it to connect or check the logs if it does not.",
		"Workspace Agent 尚未连接。请等待其连接；如果一直未连接，请查看日志。",
	],
	[
		"Continue to wait and check the log output for errors. If agents do not connect, try restarting the workspace.",
		"请继续等待并检查日志输出中的错误。如果 Agent 未连接，请尝试重启 Workspace。",
	],
	[
		"Check the log output for errors. If agents do not reconnect, try restarting the workspace.",
		"请检查日志输出中的错误。如果 Agent 未重新连接，请尝试重启 Workspace。",
	],
	[
		"The workspace is not available while agents shut down.",
		"Agent 关闭期间，Workspace 不可用。",
	],
	[
		"\"{{value0}}\" has exceeded the expected time. Check the agent logs for details.",
		"“{{value0}}”已超过预期运行时间。请查看 Agent 日志了解详情。",
	],
	[
		"\"{{value0}}\" exited with {{value1}}. Check the agent logs for details.",
		"“{{value0}}”已退出，退出码为 {{value1}}。请查看 Agent 日志了解详情。",
	],
	[
		"\"{{value0}}\" has exited with an error. Check the agent logs for details.",
		"“{{value0}}”因错误退出。请查看 Agent 日志了解详情。",
	],
	["Check the agent logs for details.", "请查看 Agent 日志了解详情。"],
	["{{value0}} must be valid JSON.", "{{value0}} 必须是有效的 JSON。"],
	["{{value0}} must be a JSON array.", "{{value0}} 必须是 JSON 数组。"],
	["{{value0}} must be a JSON object.", "{{value0}} 必须是 JSON 对象。"],
	[
		"Default and max reasoning effort must both be set.",
		"必须同时设置默认和最大推理强度。",
	],
	["Creating {{value0}} \"{{value1}}\"...", "正在创建{{value0}}“{{value1}}”..."],
	[
		"{{value0}} \"{{value1}}\" created successfully.",
		"已成功创建{{value0}}“{{value1}}”。",
	],
	["Service account", "服务账户"],
	["User", "用户"],
	[
		"This template requires {{value0}} not connected.",
		"此 Template 需要尚未连接的{{value0}}。",
	],
	[
		"Auto-creation has been disabled. Please connect all required external authentication providers before continuing.",
		"已禁用自动创建。请先连接所有必需的外部身份验证提供商，然后再继续。",
	],
	["Auto-creation has been disabled.", "已禁用自动创建。"],
	["Updating appearance settings...", "正在更新外观设置..."],
	["Appearance settings updated successfully.", "外观设置已更新。"],
	["Saving user \"{{value0}}\"…", "正在保存用户“{{value0}}”..."],
	["User \"{{value0}}\" updated successfully.", "用户“{{value0}}”已更新。"],
	[
		"Removing member \"{{value0}}\" from \"{{value1}}\"...",
		"正在从“{{value1}}”中移除成员“{{value0}}”...",
	],
	[
		"Member \"{{value0}}\" has been removed from \"{{value1}}\" successfully.",
		"已成功从“{{value1}}”中移除成员“{{value0}}”。",
	],
	[
		"Failed to remove member \"{{value0}}\" from \"{{value1}}\".",
		"无法从“{{value1}}”中移除成员“{{value0}}”。",
	],
	[
		"{{value0}} AI budget override for \"{{value1}}\"...",
		"正在{{value0}}“{{value1}}”的 AI 预算覆盖设置...",
	],
	["Removing", "移除"],
	["Updating", "更新"],
	[
		"AI budget override for \"{{value0}}\" {{value1}} successfully.",
		"已成功{{value1}}“{{value0}}”的 AI 预算覆盖设置。",
	],
	["removed", "移除"],
	["updated", "更新"],
	[
		"Failed to {{value0}} AI budget override for \"{{value1}}\".",
		"无法{{value0}}“{{value1}}”的 AI 预算覆盖设置。",
	],
	["remove", "移除"],
	["update", "更新"],
	["{{value0}} custom role \"{{value1}}\"...", "正在{{value0}}自定义角色“{{value1}}”..."],
	["Creating", "创建"],
	[
		"Custom role \"{{value0}}\" {{value1}} successfully.",
		"已成功{{value1}}自定义角色“{{value0}}”。",
	],
	["created", "创建"],
	["Updating IdP group sync settings...", "正在更新 IdP 组同步设置..."],
	["IdP group sync settings updated.", "IdP 组同步设置已更新。"],
	[
		"Removing \"{{value0}}\" from \"{{value1}}\"...",
		"正在从“{{value1}}”中移除“{{value0}}”...",
	],
	[
		"\"{{value0}}\" has been removed from \"{{value1}}\".",
		"已从“{{value1}}”中移除“{{value0}}”。",
	],
	[
		"Canceling provisioner job \"{{value0}}\"...",
		"正在取消 Provisioner 任务“{{value0}}”...",
	],
	[
		"Provisioner job \"{{value0}}\" canceled successfully.",
		"已成功取消 Provisioner 任务“{{value0}}”。",
	],
	[
		"Failed to cancel provisioner job \"{{value0}}\".",
		"无法取消 Provisioner 任务“{{value0}}”。",
	],
	["Updating workspace sharing settings...", "正在更新 Workspace 共享设置..."],
	[
		"Failed to update workspace sharing settings.",
		"无法更新 Workspace 共享设置。",
	],
	["Deleting template{{value0}}...", "正在删除 Template{{value0}}..."],
	["Template{{value0}} deleted successfully.", "已成功删除 Template{{value0}}。"],
	["Variable is required.", "必须填写变量。"],
	[
		"Unsupported file type. Import a .env, .json, .yaml, or .yml file.",
		"不支持此文件类型。请导入 .env、.json、.yaml 或 .yml 文件。",
	],
	[
		"File is too large. Import a file of 1 MiB or smaller.",
		"文件过大。请导入不超过 1 MiB 的文件。",
	],
	["Failed to read the selected file.", "无法读取所选文件。"],
	["Something went wrong.", "出现错误。"],
	[
		"Autostart is unable to automatically update your workspace. Manually update your workspace to reenable Autostart.",
		"自动启动无法自动更新 Workspace。请手动更新 Workspace 以重新启用自动启动。",
	],
	[
		"The workspace agent is running but a startup script exited with an error.",
		"Workspace Agent 正在运行，但有启动脚本因错误退出。",
	],
	[
		"Expand an agent's logs to view per-agent health details.",
		"展开 Agent 日志以查看各 Agent 的健康状态详情。",
	],
	["{{value0}} information", "{{value0}} 信息"],
	["Notification method for {{value0}}", "{{value0}} 的通知方式"],
	[
		"This group gives {{value0}} quota credits to each\n            of its members.",
		"此组向每位成员提供 {{value0}} 个配额积分。",
	],
	["View {{value0}} group{{value1}}", "查看 {{value0}} 个组{{value1}}"],
	[
		"Checking whether {{value0}} is available. Try again in a moment.",
		"正在检查 {{value0}} 是否可用，请稍后重试。",
	],
	["Failed to {{value0}} notifications.", "{{value0}} 通知失败。"],
	["The saved content could not be parsed as SKILL.md.", "无法将保存的内容解析为 SKILL.md。"],
	["Disconnect {{value0}}?", "要断开 {{value0}} 吗？"],
	["Download {{value0}}", "下载 {{value0}}"],
	["Open actions for {{value0}}", "打开 {{value0}} 的操作菜单"],
	["Compacts at {{value0}}%", "在 {{value0}}% 时压缩"],
	["Always collapsed", "始终折叠"],
	["Always expanded", "始终展开"],
	["See {{value0}} of {{value1}} message", "查看消息 {{value1}} 的第 {{value0}} 项"],
	[
		"How shell command output should be displayed by default. 'Auto' opens running commands and completed commands with output, then keeps empty output collapsed. 'Always expanded' opens shell output by default. 'Always collapsed' keeps it collapsed.",
		"设置 shell 命令输出的默认显示方式。“自动”会展开正在运行的命令和有输出的已完成命令，并折叠空输出；“始终展开”默认展开输出；“始终折叠”则保持折叠。",
	],
	[
		"Controls how code edit diffs appear. 'Auto' starts single-file writes collapsed and opens multi-file edits with a height-constrained preview. 'Always expanded' opens diffs by default; 'Always collapsed' keeps them collapsed.",
		"设置代码编辑 diff 的显示方式。“自动”会折叠单文件写入，并以限高预览展开多文件编辑；“始终展开”默认展开 diff；“始终折叠”则保持折叠。",
	],
	[
		"How thinking blocks should be displayed by default. 'Auto' fully expands during streaming, then auto-collapses when done. 'Preview' auto-expands with a height constraint during streaming. 'Always expanded' shows full content. 'Always collapsed' keeps them collapsed.",
		"设置思考内容的默认显示方式。“自动”会在流式传输期间完全展开，并在完成后折叠；“预览”会在流式传输期间以限高方式展开；“始终展开”显示完整内容；“始终折叠”则保持折叠。",
	],
	[
		"AI Gateway is a smart gateway for AI that provides centralized management, auditing, and attribution for LLM usage.",
		"AI Gateway 为 AI 提供集中管理、审计和 LLM 用量归因。",
	],
	["Deleted AI Gateway key \"{{value0}}\" successfully.", "已成功删除 AI Gateway 密钥“{{value0}}”。"],
	["Model prices are managed by AI Gateway.", "模型价格由 AI Gateway 管理。"],
	["Failed to delete provider \"{{value0}}\".", "无法删除提供商“{{value0}}”。"],
	["Failed to update provider \"{{value0}}\".", "无法更新提供商“{{value0}}”。"],
	["ICMP Ping", "ICMP Ping"],
	["IPv6 Support", "IPv6 支持"],
	["NAT Traversal", "NAT 穿透"],
	["{{value0}}ms", "{{value0}} 毫秒"],
	[
		"Delete enqueued for \"{{value0}}\", but no matching provisioners are available. The workspace will be deleted once one comes online.",
		"已将“{{value0}}”加入删除队列，但当前没有匹配的 Provisioner。Provisioner 上线后将删除该 Workspace。",
	],
	["Unable to watch \"{{value0}}\" agent logs.", "无法监听“{{value0}}”Agent 日志。"],
	["See affected Workspaces", "查看受影响的 Workspaces"],
	["See affected Workspaces for {{value0}}", "查看 {{value0}} 受影响的 Workspaces"],
	["{{value0}} templates still use classic parameters", "{{value0}} 个 Templates 仍使用经典参数"],
	["Group \"{{value0}}\" added to workspace successfully.", "已成功将组“{{value0}}”添加到 Workspace。"],
	["Last Prompt At [UTC", "最后提示时间 [UTC"],
	["Active seat usage", "活跃席位用量"],
	["Active seat usage information", "活跃席位用量信息"],
	["Seat usage", "席位用量"],
	["SSH Keys", "SSH 密钥"],
	["I acknowledge these risks.", "我了解并接受这些风险。"],
	["Please acknowledge risks to continue.", "请确认已了解这些风险后继续。"],
	["Nothing to update.", "无需更新。"],
	["Open VSCode Insiders", "打开 VSCode Insiders"],
	["Template select for workspace", "Workspace Template 选择器"],
	["Type/select a workspace template", "输入或选择 Workspace Template"],
	["Archiving and deleting", "正在归档并删除"],
	["Removing", "正在移除"],
	["Unlinking", "正在取消关联"],
	["Revoking", "正在撤销"],
	["Seats", "席位"],
	["App", "应用"],
	["Available provisioners:", "可用 Provisioner："],
	["No provisioners", "无 Provisioner"],
	[
		"All available agent capacity is currently in use.",
		"当前所有 Agent 容量均在使用中。",
	],
	[
		"Are you sure you want to cancel the provisioner job \"{{value0}}\"? This operation will result in the associated workspaces not getting created.",
		"您确定要取消 Provisioner 任务“{{value0}}”吗？此操作将导致相关 Workspaces 无法创建。",
	],
]);

const files = walk(sourceRoot).filter((file) => {
	const normalized = file.split(sep).join("/");
	return (
		(file.endsWith(".ts") || file.endsWith(".tsx")) &&
		!file.endsWith(".d.ts") &&
		(selectedFile === undefined || file === selectedFile) &&
		!normalized.includes("/i18n/") &&
		!normalized.includes("/testHelpers/") &&
		!normalized.includes("/storybookUtils") &&
		!normalized.includes("/testFixtures") &&
		!normalized.includes("/api/typesGenerated") &&
		!normalized.match(/\.(stories|test|mock)\.tsx?$/)
	);
});

const enCatalog = readCatalog(enCatalogPath);
const zhCatalog = readCatalog(zhCatalogPath);
const untranslated = [];
const newEntries = new Map();

for (const file of files) {
	const source = readFileSync(file, "utf8");
	const ast = recast.parse(source, { parser: babelTSParser });
	const namespace = namespaceFor(file);
	const componentFunctions = new Set();
	let needsGlobalI18n = false;
	let needsCurrentIntlLocale = false;
	let changed = false;

	const localizePath = (path, value, replace) => {
		if (
			!isTranslatable(value) ||
			isInsideProtectedElement(path) ||
			isInsideProtectedObject(path) ||
			isInsideProtectedJSXAttribute(path)
		) {
			return;
		}

		const location = path.node.loc?.start;
		const key = keyFor(file, value);
		const fullKey = `${namespace}:${key}`;
		untranslated.push({
			file: relative(siteRoot, file),
			line: location?.line ?? 1,
			value: value.trim(),
		});
		if (!write) {
			return;
		}

		setNested(enCatalog, namespace, key, value);
		if (getNested(zhCatalog, namespace, key) === undefined) {
			newEntries.set(fullKey, value);
		}

		const componentFunction = findComponentFunction(path);
		const useGlobalI18n =
			componentFunction === undefined ||
			isInsideFunctionParameter(path, componentFunction);
		const callee = useGlobalI18n
			? b.memberExpression(b.identifier("i18n"), b.identifier("t"))
			: b.identifier("tI18n");
		if (!useGlobalI18n) {
			componentFunctions.add(componentFunction);
		} else {
			needsGlobalI18n = true;
		}
		const arguments_ = [
			b.stringLiteral(componentFunction ? key : fullKey),
		];
		if (replace.interpolations) {
			arguments_.push(
				b.objectExpression(
					replace.interpolations.map((expression, index) =>
						b.objectProperty(b.identifier(`value${index}`), expression),
					),
				),
			);
		}
		replace(b.callExpression(callee, arguments_));
		changed = true;
	};

	const localizeExpressionPath = (path, replace) => {
		if (n.StringLiteral.check(path.node)) {
			localizePath(path, path.node.value, replace);
			return;
		}
		if (!n.TemplateLiteral.check(path.node)) return;
		const value = path.node.quasis
			.map(
				(quasi, index) =>
					`${quasi.value.cooked ?? quasi.value.raw}${
						index < path.node.expressions.length ? `{{value${index}}}` : ""
					}`,
			)
			.join("");
		replace.interpolations = path.node.expressions;
		localizePath(path, value, replace);
	};

	visit(ast, {
		visitJSXText(path) {
			const value = cleanJSXText(path.node.value);
			localizePath(path, value, (expression) => {
				path.replace(b.jsxExpressionContainer(expression));
			});
			return false;
		},
		visitJSXAttribute(path) {
			const name = jsxAttributeName(path.node.name);
			if (!name || !visibleAttributes.has(name)) {
				this.traverse(path);
				return;
			}

			if (n.StringLiteral.check(path.node.value)) {
				const valuePath = path.get("value");
				localizePath(valuePath, path.node.value.value, (expression) => {
					path.node.value = b.jsxExpressionContainer(expression);
				});
				return false;
			}
			this.traverse(path);
		},
		visitJSXExpressionContainer(path) {
			if (
				!n.StringLiteral.check(path.node.expression) &&
				!n.TemplateLiteral.check(path.node.expression)
			) {
				this.traverse(path);
				return;
			}
			const parent = path.parentPath?.node;
			const isVisibleAttribute =
				n.JSXAttribute.check(parent) &&
				visibleAttributes.has(jsxAttributeName(parent.name) ?? "");
			if (
				!n.JSXElement.check(parent) &&
				!n.JSXFragment.check(parent) &&
				!isVisibleAttribute
			) {
				return false;
			}

			const expressionPath = path.get("expression");
			localizeExpressionPath(expressionPath, (expression) => {
				path.node.expression = expression;
			});
			return false;
		},
		visitObjectProperty(path) {
			if (path.node.computed) {
				this.traverse(path);
				return;
			}
			const key = objectPropertyName(path.node.key);
				if (
					!key ||
					(!visibleObjectProperties.has(key) &&
						!isInsideVisibleNamedValue(path) &&
						!isContextualVisibleObjectProperty(path, key))
			) {
				this.traverse(path);
				return;
			}
			const valuePath = path.get("value");
			localizeExpressionPath(valuePath, (expression) => {
				path.node.value = expression;
			});
			this.traverse(path);
		},
		visitConditionalExpression(path) {
			if (
				!isVisibleJSXExpression(path) &&
					!isInsideVisibleJSXAttribute(path) &&
					!isInsideVisibleObjectProperty(path) &&
					!isInsideVisibleNamedValue(path) &&
					!isInsideToastPromiseOptions(path)
			) {
				this.traverse(path);
				return;
			}
			for (const field of ["consequent", "alternate"]) {
				const branchPath = path.get(field);
				localizeExpressionPath(branchPath, (expression) => {
					path.node[field] = expression;
				});
			}
			this.traverse(path);
		},
		visitArrowFunctionExpression(path) {
			if (
				isInsideToastPromiseOptions(path) ||
				isInsideVisibleJSXAttribute(path) ||
				isInsideVisibleObjectProperty(path) ||
				isInsideVisibleNamedValue(path) ||
				isInsideVisibleReturnFunction(path)
			) {
				const bodyPath = path.get("body");
				localizeExpressionPath(bodyPath, (expression) => {
					path.node.body = expression;
				});
			}
			this.traverse(path);
		},
		visitReturnStatement(path) {
			if (
				path.node.argument &&
				(isInsideToastPromiseOptions(path) ||
					isInsideVisibleJSXAttribute(path) ||
					isInsideVisibleObjectProperty(path) ||
					isInsideVisibleNamedValue(path) ||
					isInsideVisibleReturnFunction(path))
			) {
				const argumentPath = path.get("argument");
				localizeExpressionPath(argumentPath, (expression) => {
					path.node.argument = expression;
				});
			}
			this.traverse(path);
		},
		visitArrayExpression(path) {
			if (
				!isInsideVisibleJSXAttribute(path) &&
				!isInsideVisibleObjectProperty(path) &&
				!isInsideVisibleNamedValue(path)
			) {
				this.traverse(path);
				return;
			}
			for (let index = 0; index < path.node.elements.length; index++) {
				const elementPath = path.get("elements", index);
				localizeExpressionPath(elementPath, (expression) => {
					path.node.elements[index] = expression;
				});
			}
			this.traverse(path);
		},
		visitVariableDeclarator(path) {
			if (
				n.Identifier.check(path.node.id) &&
				path.node.init &&
				isVisibleValueName(path.node.id.name)
			) {
				const initializerPath = path.get("init");
				localizeExpressionPath(initializerPath, (expression) => {
					path.node.init = expression;
				});
			}
			this.traverse(path);
		},
		visitAssignmentPattern(path) {
			if (
				n.Identifier.check(path.node.left) &&
				isVisibleValueName(path.node.left.name)
			) {
				const rightPath = path.get("right");
				localizeExpressionPath(rightPath, (expression) => {
					path.node.right = expression;
				});
			}
			this.traverse(path);
		},
		visitAssignmentExpression(path) {
			const left = path.node.left;
			const isVisibleAssignment =
				(n.Identifier.check(left) && isVisibleValueName(left.name)) ||
				(n.MemberExpression.check(left) &&
					n.Identifier.check(left.object) &&
					left.object.name === "errors");
			if (isVisibleAssignment) {
				const rightPath = path.get("right");
				localizeExpressionPath(rightPath, (expression) => {
					path.node.right = expression;
				});
			}
			this.traverse(path);
		},
		visitLogicalExpression(path) {
			if (!isVisibleJSXExpression(path)) {
				this.traverse(path);
				return;
			}
			const rightPath = path.get("right");
			localizeExpressionPath(rightPath, (expression) => {
				path.node.right = expression;
			});
			this.traverse(path);
		},
		visitCallExpression(path) {
			if (isLocaleFormattingCall(path.node)) {
				const location = path.node.loc?.start;
				untranslated.push({
					file: relative(siteRoot, file),
					line: location?.line ?? 1,
					value: "Locale-sensitive formatting must use currentIntlLocale()",
				});
				if (write) {
					const localeCall = b.callExpression(b.identifier("currentIntlLocale"), []);
					if (path.node.arguments.length === 0) path.node.arguments.push(localeCall);
					else path.node.arguments[0] = localeCall;
					needsCurrentIntlLocale = true;
					changed = true;
				}
			}
			const argumentIndexes = localizedCallArguments(path.node);
			if (argumentIndexes.length === 0) {
				this.traverse(path);
				return;
			}
			for (const index of argumentIndexes) {
				const argumentPath = path.get("arguments", index);
				localizeExpressionPath(argumentPath, (expression) => {
					path.node.arguments[index] = expression;
				});
			}
			this.traverse(path);
		},
		visitNewExpression(path) {
			if (!isIntlFormatter(path.node)) {
				this.traverse(path);
				return;
			}
			const location = path.node.loc?.start;
			untranslated.push({
				file: relative(siteRoot, file),
				line: location?.line ?? 1,
				value: "Intl formatter must use currentIntlLocale()",
			});
			if (write) {
				const localeCall = b.callExpression(b.identifier("currentIntlLocale"), []);
				if (path.node.arguments.length === 0) path.node.arguments.push(localeCall);
				else path.node.arguments[0] = localeCall;
				needsCurrentIntlLocale = true;
				changed = true;
			}
			this.traverse(path);
		},
	});

	if (!write || !changed) {
		continue;
	}

	for (const fn of componentFunctions) {
		insertTranslationHook(fn, namespace);
	}
	if (componentFunctions.size > 0) {
		ensureNamedImport(ast.program, "react-i18next", "useTranslation");
	}
	if (needsGlobalI18n) {
		ensureNamedImport(ast.program, "#/i18n", "i18n");
	}
	if (needsCurrentIntlLocale) {
		ensureNamedImport(ast.program, "#/i18n/locale", "currentIntlLocale");
	}

	writeFileSync(file, recast.print(ast).code);
}

if (!write) {
	if (untranslated.length === 0) {
		validateCatalogs(enCatalog, zhCatalog);
		console.log("All production JSX strings are localized.");
		process.exit(0);
	}
	for (const finding of untranslated.slice(0, 500)) {
		console.error(
			`${finding.file}:${finding.line}: ${JSON.stringify(finding.value)}`,
		);
	}
	if (untranslated.length > 500) {
		console.error(`...and ${untranslated.length - 500} more`);
	}
	console.error(
		`Found ${untranslated.length} production JSX strings outside the catalogs.`,
	);
	process.exit(1);
}

for (const [fullKey, value] of newEntries) {
	setFullKey(zhCatalog, fullKey, value);
}
applyExactTranslations(enCatalog, zhCatalog);
writeCatalog(enCatalogPath, enCatalog);
writeCatalog(zhCatalogPath, zhCatalog);

if (translate) {
	const translations = await translateEntries(pendingTranslations(enCatalog, zhCatalog));
	for (const [fullKey, value] of translations) {
		setFullKey(zhCatalog, fullKey, value);
	}
}

normalizeTranslations(enCatalog, zhCatalog);

writeCatalog(enCatalogPath, enCatalog);
writeCatalog(zhCatalogPath, zhCatalog);
validateCatalogs(enCatalog, zhCatalog);
console.log(
	`Localized ${untranslated.length} JSX strings and added ${newEntries.size} catalog entries.`,
);

function walk(directory) {
	const entries = [];
	for (const name of readdirSync(directory)) {
		const path = join(directory, name);
		if (statSync(path).isDirectory()) {
			entries.push(...walk(path));
		} else {
			entries.push(path);
		}
	}
	return entries;
}

function readCatalog(path) {
	return existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : {};
}

function writeCatalog(path, catalog) {
	writeFileSync(path, `${JSON.stringify(sortDeep(catalog), null, "\t")}\n`);
}

function namespaceFor(file) {
	const path = relative(sourceRoot, file).split(sep);
	if (path[0] === "components") return "components";
	if (path[0] === "modules") {
		if (path[1] === "dashboard") return "dashboard";
		if (path[1] === "notifications") return "notifications";
		if (["apps", "resources", "workspaces"].includes(path[1])) {
			return "workspaces";
		}
		if (path[1] === "templates") return "templates";
		if (
			["management", "organizations", "provisioners", "users"].includes(
				path[1],
			)
		) {
			return "administration";
		}
		return "components";
	}
	const page = path[1] ?? "";
	if (page.includes("Agent") || page.includes("AI")) return "agents";
	if (page.includes("Workspace")) return "workspaces";
	if (page.includes("Template") || page.includes("Starter")) return "templates";
	if (
		page.includes("Login") ||
		page.includes("Auth") ||
		page.includes("Setup")
	) {
		return "auth";
	}
	if (
		page.includes("User") ||
		page.includes("Security") ||
		page.includes("Schedule")
	) {
		return "users";
	}
	if (
		page.includes("Deployment") ||
		page.includes("Organization") ||
		page.includes("Audit") ||
		page.includes("Group") ||
		page.includes("Provisioner") ||
		page.includes("Role")
	) {
		return "administration";
	}
	return "pages";
}

function keyFor(file, value) {
	const path = relative(sourceRoot, file)
		.split(sep)
		.slice(1)
		.join(".")
		.replace(/\.tsx?$/, "");
	const words = value
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "_")
		.replace(/^_|_$/g, "")
		.slice(0, 48);
	const hash = createHash("sha256").update(value).digest("hex").slice(0, 8);
	return `${path}.${words || "text"}_${hash}`;
}

function cleanJSXText(value) {
	const lines = value.split(/\r\n|\n|\r/);
	let lastNonEmptyLine = 0;
	for (let i = 0; i < lines.length; i++) {
		if (/[^ \t]/.test(lines[i])) lastNonEmptyLine = i;
	}
	let result = "";
	for (let i = 0; i < lines.length; i++) {
		let line = lines[i].replace(/\t/g, " ");
		if (i !== 0) line = line.replace(/^ +/, "");
		if (i !== lines.length - 1) line = line.replace(/ +$/, "");
		if (line) {
			if (i !== lastNonEmptyLine) line += " ";
			result += line;
		}
	}
	return result;
}

function isTranslatable(value) {
	const text = value.trim();
	const textWithoutInterpolations = text.replaceAll(/\{\{[^}]+\}\}/g, "");
	if (!/[A-Za-z]/.test(textWithoutInterpolations)) return false;
	if (exactTranslations.has(text)) return true;
	if (protectedTerms.some((term) => term.toLowerCase() === text.toLowerCase())) {
		return false;
	}
	if (/^(https?:|wss?:|mailto:|\.\/|\.\.\/)/i.test(text)) return false;
	if (/^\/\S*$/.test(text)) return false;
	if (/^var\(--[a-z0-9-]+\)$/i.test(text)) return false;
	if (/^(?:favicon(?:-[a-z]+)?|h[1-6])$/i.test(text)) return false;
	if (/^[a-z][a-z0-9-]*-\.\.\.$/i.test(text)) return false;
	if (
		!text.includes(" ") &&
		/^(?:bg|border|fill|font|grid|outline|ring|shadow|stroke|text)-/.test(text)
	) {
		return false;
	}
	if (!text.includes(" ") && /[_]/.test(text)) return false;
	if (/^#[0-9a-f]{3,8}$/i.test(text)) return false;
	return true;
}

function jsxAttributeName(node) {
	return n.JSXIdentifier.check(node) ? node.name : undefined;
}

function objectPropertyName(node) {
	if (n.Identifier.check(node) || n.StringLiteral.check(node)) return node.name ?? node.value;
	return undefined;
}

function localizedCallArguments(node) {
	if (n.Identifier.check(node.callee)) {
		if (node.callee.name === "getErrorMessage") return [1];
		if (["displayNameValidator", "nameValidator"].includes(node.callee.name)) {
			return [0];
		}
		if (node.callee.name === "drawVectorText") return [1];
		if (node.callee.name === "drawTooltip") return [1, 2];
		if (["getTemplatePageTitle", "pageTitle"].includes(node.callee.name)) {
			return node.arguments
				.map((argument, index) =>
					n.StringLiteral.check(argument) || n.TemplateLiteral.check(argument)
						? index
						: -1,
				)
				.filter((index) => index >= 0);
		}
	}
	if (!n.MemberExpression.check(node.callee) || node.callee.computed) return [];
	if (!n.Identifier.check(node.callee.property)) return [];
	const method = node.callee.property.name;
	if (method === "fillText") return [0];
	if (method === "test") {
		const message = node.arguments[1];
		return n.StringLiteral.check(message) || n.TemplateLiteral.check(message)
			? [1]
			: [];
	}
	if (
		n.Identifier.check(node.callee.object) &&
		node.callee.object.name === "toast" &&
		["error", "info", "success", "warning"].includes(method)
	) {
		return [0];
	}
	if (
		[
			"defined",
			"email",
			"integer",
			"length",
			"lessThan",
			"matches",
			"max",
			"min",
			"moreThan",
			"negative",
			"nonNullable",
			"notOneOf",
			"oneOf",
			"positive",
			"required",
			"typeError",
			"url",
		].includes(method)
	) {
		return node.arguments
			.map((argument, index) =>
				n.StringLiteral.check(argument) || n.TemplateLiteral.check(argument)
					? index
					: -1,
			)
			.filter((index) => index >= 0);
	}
	return [];
}

function isVisibleJSXExpression(path) {
	let current = path.parentPath;
	while (current) {
		if (n.JSXExpressionContainer.check(current.node)) {
			const parent = current.parentPath?.node;
			if (n.JSXElement.check(parent) || n.JSXFragment.check(parent)) return true;
			return (
				n.JSXAttribute.check(parent) &&
				visibleAttributes.has(jsxAttributeName(parent.name) ?? "")
			);
		}
		if (
			n.FunctionDeclaration.check(current.node) ||
			n.FunctionExpression.check(current.node) ||
			n.ArrowFunctionExpression.check(current.node)
		) {
			return false;
		}
		current = current.parentPath;
	}
	return false;
}

function isVisibleValueName(name) {
	return /(?:ariaLabel|caption|description|descriptions|emptyMessage|error|errors|features|heading|helperText|infoText|label|labels|loadingText|message|messages|messageText|note|placeholder|progressLabel|sentence|statusFallback|statusText|submitLabel|subtitle|title|titles|tooltip|unavailableMessage|warning|warnings)$/i.test(
		name,
	);
}

function isVisibleReturnFunctionName(name) {
	return (
		[
			"autostartDisplay",
			"autostopDisplay",
			"connectionTypeToFriendlyName",
			"deriveStatusMessage",
			"displayFor",
			"displayWorkspaceBuildDuration",
			"getPendingStatusLabel",
			"getSubagentLabel",
		].includes(name) ||
		/^(?:derive|display|format|get).*(?:Description|Error|FriendlyName|Label|Message|Subtitle|Text|Title|Tooltip)$/.test(
			name,
		)
	);
}

function isInsideVisibleNamedValue(path) {
	let current = path.parentPath;
	while (current) {
		if (
			n.FunctionDeclaration.check(current.node) ||
			n.FunctionExpression.check(current.node) ||
			n.ArrowFunctionExpression.check(current.node)
		) {
			return false;
		}
		if (
			n.VariableDeclarator.check(current.node) &&
			n.Identifier.check(current.node.id)
		) {
			return isVisibleValueName(current.node.id.name);
		}
		if (n.AssignmentExpression.check(current.node)) {
			const left = current.node.left;
			if (n.Identifier.check(left)) return isVisibleValueName(left.name);
		}
		current = current.parentPath;
	}
	return false;
}

function isInsideVisibleReturnFunction(path) {
	let current = path.parentPath;
	while (current) {
		if (
			n.FunctionDeclaration.check(current.node) &&
			current.node.id &&
			isVisibleReturnFunctionName(current.node.id.name)
		) {
			return true;
		}
		if (
			(n.FunctionExpression.check(current.node) ||
				n.ArrowFunctionExpression.check(current.node)) &&
			n.VariableDeclarator.check(current.parentPath?.node) &&
			n.Identifier.check(current.parentPath.node.id) &&
			isVisibleReturnFunctionName(current.parentPath.node.id.name)
		) {
			return true;
		}
		current = current.parentPath;
	}
	return false;
}

function isInsideVisibleObjectProperty(path) {
	let current = path.parentPath;
	while (current) {
		if (n.ObjectProperty.check(current.node)) {
			const key = objectPropertyName(current.node.key);
			return key !== undefined && visibleObjectProperties.has(key);
		}
		current = current.parentPath;
	}
	return false;
}

function isInsideVisibleJSXAttribute(path) {
	let current = path.parentPath;
	while (current) {
		if (n.JSXAttribute.check(current.node)) {
			const name = jsxAttributeName(current.node.name);
			return name !== undefined && visibleAttributes.has(name);
		}
		current = current.parentPath;
	}
	return false;
}

function isContextualVisibleObjectProperty(path, key) {
	if (isSelectedVisibleObjectProperty(path, key)) {
		return true;
	}
	if (
		isInsideToastPromiseOptions(path) &&
		["description", "detail", "error", "loading", "message", "success"].includes(
			key,
		)
	) {
		return true;
	}
	if (
		isInsideVisibleReturnFunction(path) &&
		["description", "detail", "label", "message", "title", "tooltip"].includes(
			key,
		)
	) {
		return true;
	}
	if (!["detail", "message", "title"].includes(key)) return false;
	let current = path.parentPath;
	while (current) {
		if (n.CallExpression.check(current.node)) {
			const callee = current.node.callee;
			if (
				n.Identifier.check(callee) &&
				/^set[A-Z].*(Error|Status)$/.test(callee.name)
			) {
				return true;
			}
			if (
				n.MemberExpression.check(callee) &&
				!callee.computed &&
				n.Identifier.check(callee.property) &&
				(callee.property.name === "createError" ||
					/^set[A-Z].*Error$/.test(callee.property.name))
			) {
				return true;
			}
			if (
				key === "message" &&
				n.MemberExpression.check(callee) &&
				!callee.computed &&
				n.Identifier.check(callee.property) &&
				callee.property.name === "matches"
			) {
				return true;
			}
		}
		current = current.parentPath;
	}
	return false;
}

function isSelectedVisibleObjectProperty(path, key) {
	let current = path.parentPath;
	while (current) {
		if (
			n.FunctionDeclaration.check(current.node) ||
			n.FunctionExpression.check(current.node) ||
			n.ArrowFunctionExpression.check(current.node)
		) {
			return false;
		}
		if (
			n.VariableDeclarator.check(current.node) &&
			n.ObjectPattern.check(current.node.id)
		) {
			return current.node.id.properties.some((property) => {
				if (!n.ObjectProperty.check(property)) return false;
				const propertyKey = objectPropertyName(property.key);
				return (
					propertyKey === key &&
					n.Identifier.check(property.value) &&
					isVisibleValueName(property.value.name)
				);
			});
		}
		current = current.parentPath;
	}
	return false;
}

function isInsideToastPromiseOptions(path) {
	let current = path.parentPath;
	while (current) {
		if (n.CallExpression.check(current.node)) {
			const callee = current.node.callee;
			return (
				n.MemberExpression.check(callee) &&
				!callee.computed &&
				n.Identifier.check(callee.object) &&
				callee.object.name === "toast" &&
				n.Identifier.check(callee.property) &&
				callee.property.name === "promise"
			);
		}
		current = current.parentPath;
	}
	return false;
}

function isLocaleFormattingCall(node) {
	if (!n.MemberExpression.check(node.callee) || node.callee.computed) return false;
	if (!n.Identifier.check(node.callee.property)) return false;
	if (
		!["toLocaleDateString", "toLocaleString", "toLocaleTimeString"].includes(
			node.callee.property.name,
		)
	) {
		return false;
	}
	if (node.arguments.length === 0) return true;
	const locale = node.arguments[0];
	return (
		(n.StringLiteral.check(locale) &&
			["default", "en", "en-US"].includes(locale.value)) ||
		(n.Identifier.check(locale) && locale.name === "undefined")
	);
}

function isIntlFormatter(node) {
	if (!n.MemberExpression.check(node.callee) || node.callee.computed) return false;
	if (
		!n.Identifier.check(node.callee.object) ||
		node.callee.object.name !== "Intl" ||
		!n.Identifier.check(node.callee.property) ||
		!["DateTimeFormat", "ListFormat", "NumberFormat", "RelativeTimeFormat"].includes(
			node.callee.property.name,
		)
	) {
		return false;
	}
	if (node.arguments.length === 0) return true;
	const locale = node.arguments[0];
	return (
		(n.StringLiteral.check(locale) &&
			["default", "en", "en-US"].includes(locale.value)) ||
		(n.Identifier.check(locale) && locale.name === "undefined")
	);
}

function isInsideProtectedElement(path) {
	let current = path.parentPath;
	while (current) {
		if (n.JSXElement.check(current.node)) {
			const name = current.node.openingElement.name;
			if (n.JSXIdentifier.check(name) && protectedElements.has(name.name)) {
				return true;
			}
		}
		current = current.parentPath;
	}
	return false;
}

function isInsideProtectedObject(path) {
	let current = path.parentPath;
	while (current) {
		if (n.ObjectProperty.check(current.node)) {
			const key = objectPropertyName(current.node.key);
			if (["className", "classNames", "classes", "style", "styles"].includes(key)) {
				return true;
			}
		}
		if (
			n.FunctionDeclaration.check(current.node) ||
			n.FunctionExpression.check(current.node) ||
			n.ArrowFunctionExpression.check(current.node)
		) {
			return false;
		}
		current = current.parentPath;
	}
	return false;
}

function isInsideProtectedJSXAttribute(path) {
	let current = path.parentPath;
	while (current) {
		if (n.JSXAttribute.check(current.node)) {
			const name = jsxAttributeName(current.node.name);
			return name !== undefined && !visibleAttributes.has(name);
		}
		current = current.parentPath;
	}
	return false;
}

function findComponentFunction(path) {
	let current = path.parentPath;
	while (current) {
		if (
			n.FunctionDeclaration.check(current.node) ||
			n.FunctionExpression.check(current.node) ||
			n.ArrowFunctionExpression.check(current.node)
		) {
			if (isComponentFunction(current)) return current.node;
		}
		current = current.parentPath;
	}
	return undefined;
}

function isInsideFunctionParameter(path, fn) {
	let current = path;
	while (current.parentPath) {
		if (current.parentPath.node === fn) {
			return fn.params.includes(current.node);
		}
		current = current.parentPath;
	}
	return false;
}

function isComponentFunction(path) {
	if (
		n.FunctionDeclaration.check(path.node) &&
		isComponentName(path.node.id?.name)
	) {
		return true;
	}
	let current = path.parentPath;
	for (
		let depth = 0;
		current && depth < 3;
		depth++, current = current.parentPath
	) {
		if (
			n.VariableDeclarator.check(current.node) &&
			n.Identifier.check(current.node.id)
		) {
			return isComponentName(current.node.id.name);
		}
		if (n.ObjectProperty.check(current.node) || n.ObjectMethod.check(current.node)) {
			return false;
		}
	}
	return false;
}

function isComponentName(name) {
	return (
		typeof name === "string" &&
		(/^[A-Z]/.test(name) || /^use[A-Z]/.test(name))
	);
}

function insertTranslationHook(fn, namespace) {
	if (!n.BlockStatement.check(fn.body)) {
		fn.body = b.blockStatement([b.returnStatement(fn.body)]);
	}
	const hasHook = fn.body.body.some(
		(statement) =>
			n.VariableDeclaration.check(statement) &&
			statement.declarations.some(
				(declaration) =>
					n.CallExpression.check(declaration.init) &&
					n.Identifier.check(declaration.init.callee) &&
					declaration.init.callee.name === "useTranslation",
			),
	);
	if (hasHook) return;
	const declaration = b.variableDeclaration("const", [
		b.variableDeclarator(
			b.objectPattern([
				b.objectProperty(
					b.identifier("t"),
					b.identifier("tI18n"),
					false,
					false,
				),
			]),
			b.callExpression(b.identifier("useTranslation"), [
				b.stringLiteral(namespace),
			]),
		),
	]);
	const firstStatement = fn.body.body.findIndex(
		(statement) => !n.ExpressionStatement.check(statement) || !statement.directive,
	);
	fn.body.body.splice(firstStatement === -1 ? fn.body.body.length : firstStatement, 0, declaration);
}

function ensureNamedImport(program, source, imported) {
	const existing = program.body.find(
		(statement) =>
			n.ImportDeclaration.check(statement) && statement.source.value === source,
	);
	if (existing) {
		if (
			!existing.specifiers.some(
				(specifier) =>
					n.ImportSpecifier.check(specifier) &&
					specifier.imported.name === imported,
			)
		) {
			existing.specifiers.push(b.importSpecifier(b.identifier(imported)));
		}
		return;
	}
	program.body.unshift(
		b.importDeclaration(
			[b.importSpecifier(b.identifier(imported))],
			b.stringLiteral(source),
		),
	);
}

function setNested(catalog, namespace, key, value) {
	let target = catalog;
	const parts = [namespace, ...key.split(".")];
	for (const part of parts.slice(0, -1)) {
		target[part] ??= {};
		target = target[part];
	}
	target[parts.at(-1)] = value;
}

function setFullKey(catalog, fullKey, value) {
	const separator = fullKey.indexOf(":");
	setNested(
		catalog,
		fullKey.slice(0, separator),
		fullKey.slice(separator + 1),
		value,
	);
}

function pendingTranslations(en, zh) {
	const result = new Map();
	const flatEN = flatten(en);
	const flatZH = flatten(zh);
	for (const [key, value] of flatEN) {
		const translated = flatZH.get(key);
		if (
			(translated === value || translated === normalizeTranslation(value, value)) &&
			!exactTranslations.has(value.trim()) &&
			!isTechnicalIdentifier(value)
		) {
			const separator = key.indexOf(".");
			result.set(`${key.slice(0, separator)}:${key.slice(separator + 1)}`, value);
		}
	}
	return result;
}

function applyExactTranslations(en, zh) {
	for (const [key, value] of flatten(en)) {
		const translated = exactTranslations.get(value.trim());
		if (translated === undefined) continue;
		const leading = value.match(/^\s*/)?.[0] ?? "";
		const trailing = value.match(/\s*$/)?.[0] ?? "";
		const separator = key.indexOf(".");
		setNested(
			zh,
			key.slice(0, separator),
			key.slice(separator + 1),
			leading + translated + trailing,
		);
	}
	normalizeTranslations(en, zh);
}

function normalizeTranslations(en, zh) {
	const flatEN = flatten(en);
	for (const [key, translated] of flatten(zh)) {
		const source = flatEN.get(key);
		if (source === undefined) continue;
		const normalized = normalizeTranslation(source, translated);
		if (normalized === translated) continue;
		const separator = key.indexOf(".");
		setNested(
			zh,
			key.slice(0, separator),
			key.slice(separator + 1),
			normalized,
		);
	}
}

function normalizeTranslation(source, translated) {
	const correction = translationCorrections.get(source);
	if (isTechnicalIdentifier(source)) return source;
	let normalized = correction ?? translated;
	if (/\bworkspaces?\b/i.test(source)) {
		normalized = normalized
			.replace(/\bworkspaces?\b/gi, "工作区")
			.replaceAll("工作空间", "工作区");
	}
	if (/\btemplates?\b/i.test(source)) {
		normalized = normalized.replace(/\btemplates?\b/gi, "模板");
	}
	if (/\bOpenAI-compatible\b/i.test(source)) {
		normalized = normalized.replace(/\bOpenAI-compatible\b/gi, "OpenAI 兼容");
	}
	if (/\bVercel\b/i.test(source)) {
		normalized = normalized.replaceAll("韦尔塞尔", "Vercel");
	}
	if (/\bCopilot\b/i.test(source)) {
		normalized = normalized.replaceAll("副驾驶", "Copilot");
	}
	if (/\bBedrock\b/i.test(source)) {
		normalized = normalized.replaceAll("基岩", "Bedrock");
	}
	const protectedValue = protect(normalized);
	normalized = protectedValue.text;
	if (/\btokens?\b/i.test(source)) {
		normalized = normalized.replaceAll("令牌", "Token").replaceAll("标记", "Token");
	}
	if (/\bprovisioners?\b/i.test(source)) {
		normalized = normalized.replaceAll(/配置者|配置器|供应者|供应商/g, "Provisioner");
	}
	if (/\bIdP\b/i.test(source)) {
		normalized = normalized.replaceAll("国内流离失所者", "IdP");
	}
	if (/\bURL\b/i.test(source)) {
		normalized = normalized
			.replaceAll("网址", "URL")
			.replaceAll("地址", "URL")
			.replace(/([A-Za-z0-9])URL\b/g, "$1 URL");
	}
	if (/\bprompts?\b/i.test(source)) {
		normalized = normalized.replaceAll(/提示(?:符|词)?/g, "提示词");
	}
	if (/\bAI\b/.test(source)) {
		normalized = normalized.replaceAll("人工智能", "AI");
	}
	if (/\bPremium\b/i.test(source)) {
		normalized = normalized
			.replaceAll("高级", "Premium")
			.replaceAll("溢价", "Premium");
	}
	for (const term of protectedTerms.filter(
		(term) => !["HTTP", "HTTPS"].includes(term),
	)) {
		normalized = normalized.replace(
			new RegExp(`\\b${escapeRegExp(term)}\\b`, "gi"),
			term,
		);
	}
	normalized = normalized
		.replaceAll("子代理", "子 Agent")
		.replaceAll("代理循环", "Agent 循环")
		.replaceAll("型号", "模型")
		.replaceAll("代币", "Token")
		.replaceAll("秘密", "密钥")
		.replaceAll("会员", "成员")
		.replaceAll("帐户", "账户")
		.replaceAll("路线", "路由")
		.replaceAll("配置程序", "Provisioner")
		.replaceAll("守护程序", "守护进程")
		.replaceAll("预制件", "预构建")
		.replaceAll("提供程序", "提供商")
		.replaceAll("提供者", "提供商")
		.replaceAll("组织机构", "组织")
		.replaceAll("业主", "所有者")
		.replaceAll("主动座位", "活跃席位")
		.replaceAll("座位", "席位")
		.replaceAll("VSCode 内部人员", "VSCode Insiders");
	normalized = normalized
		.replace(/([\p{Script=Han}])\s+(工作区|模板)/gu, "$1$2")
		.replace(/(工作区|模板)\s+([\p{Script=Han}])/gu, "$1$2");
	for (const term of [...protectedTerms, "SKILL.md"]) {
		const escaped = escapeRegExp(term);
		normalized = normalized
			.replace(new RegExp(`([\\p{Script=Han}])(${escaped})`, "giu"), "$1 $2")
			.replace(new RegExp(`(${escaped})([\\p{Script=Han}])`, "giu"), "$1 $2");
	}
	return restore(normalized, protectedValue.terms);
}

function isTechnicalIdentifier(value) {
	const text = value.trim().replace(/[.!]$/, "");
	return !text.includes(" ") && text.includes("_");
}

function getNested(catalog, namespace, key) {
	let target = catalog[namespace];
	for (const part of key.split(".")) {
		if (!target || typeof target !== "object") return undefined;
		target = target[part];
	}
	return target;
}

function flatten(catalog, prefix = "", result = new Map()) {
	for (const [key, value] of Object.entries(catalog)) {
		const fullKey = prefix ? `${prefix}.${key}` : key;
		if (typeof value === "string") result.set(fullKey, value);
		else flatten(value, fullKey, result);
	}
	return result;
}

function validateCatalogs(en, zh) {
	const flatEN = flatten(en);
	const flatZH = flatten(zh);
	const errors = [];
	for (const [key, value] of flatEN) {
		const translated = flatZH.get(key);
		if (translated === undefined) errors.push(`${key}: missing zh-CN translation`);
		else if (translated.trim() === "") errors.push(`${key}: empty zh-CN translation`);
		else if (placeholders(value) !== placeholders(translated)) {
			errors.push(`${key}: interpolation placeholders differ`);
		}
	}
	for (const key of flatZH.keys()) {
		if (!flatEN.has(key)) errors.push(`${key}: missing English source`);
	}
	if (errors.length > 0) throw new Error(errors.slice(0, 50).join("\n"));
}

function placeholders(value) {
	return [...value.matchAll(/\{\{\s*([^},\s]+)/g)]
		.map((match) => match[1])
		.sort()
		.join(",");
}

function sortDeep(value) {
	if (Array.isArray(value) || value === null || typeof value !== "object") {
		return value;
	}
	return Object.fromEntries(
		Object.keys(value)
			.sort((a, b) => a.localeCompare(b, "en"))
			.map((key) => [key, sortDeep(value[key])]),
	);
}

async function translateEntries(entries) {
	if (entries.size === 0) return new Map();
	const separator = "\n__CODER_I18N_SEPARATOR__\n";
	const batches = [];
	let batch = [];
	let length = 0;
	for (const entry of entries) {
		const protectedValue = protect(entry[1]);
		if (batch.length > 0 && length + protectedValue.text.length > 3500) {
			batches.push(batch);
			batch = [];
			length = 0;
		}
		batch.push({ key: entry[0], source: entry[1], ...protectedValue });
		length += protectedValue.text.length + separator.length;
	}
	if (batch.length > 0) batches.push(batch);

	const result = new Map();
	for (let index = 0; index < batches.length; index++) {
		const current = batches[index];
		const query = current.map((entry) => entry.text.trim()).join(separator);
		const url = new URL("https://clients5.google.com/translate_a/t");
		url.searchParams.set("client", "dict-chrome-ex");
		url.searchParams.set("sl", "en");
		url.searchParams.set("tl", "zh-CN");
		url.searchParams.set("q", query);
		const response = await fetch(url, {
			headers: { "User-Agent": "Mozilla/5.0" },
		});
		if (!response.ok) {
			throw new Error(`Translation request failed: ${response.status}`);
		}
		const payload = await response.json();
		const translated = payload[0].split(separator.trim());
		if (translated.length !== current.length) {
			throw new Error(
				`Translation batch ${index + 1} returned ${translated.length} of ${current.length} entries`,
			);
		}
		for (let item = 0; item < current.length; item++) {
			const entry = current[item];
			const leading = entry.source.match(/^\s*/)?.[0] ?? "";
			const trailing = entry.source.match(/\s*$/)?.[0] ?? "";
			result.set(
				entry.key,
				leading + restore(translated[item].trim(), entry.terms) + trailing,
			);
		}
		console.log(`Translated batch ${index + 1}/${batches.length}.`);
	}
	return result;
}

function protect(value) {
	let text = value;
	const terms = [];
	const patterns = [
		{ pattern: /https?:\/\/[^\s)\]}>,]+/gi },
		{ pattern: /--[a-z0-9-]+/gi },
		{ pattern: /\b[A-Z][A-Z0-9_]{2,}\b/g },
		{ pattern: /\b[a-z][a-z0-9]*_[a-z0-9_]+\b/g },
		{ pattern: /\b[a-z0-9]+(?:-[a-z0-9]+)+\b/g },
		{ pattern: /\/[a-z0-9_{}./~-]+/gi },
		{
			pattern:
				/\b(?:ns|us|ms|KiB|MiB|GiB|TiB|KB|MB|GB|TB|kHz|MHz|GHz|Kbps|Mbps|Gbps)\b/g,
		},
		...[...protectedTerms]
			.sort((left, right) => right.length - left.length)
			.map((term) => ({
				canonical: term,
				pattern: new RegExp(`\\b${escapeRegExp(term)}\\b`, "gi"),
			})),
		{ pattern: /\{\{[^}]+\}\}/g },
	];
	for (const { canonical, pattern } of patterns) {
		text = text.replace(pattern, (term) => {
			const token = `ZXQTERM${String(terms.length).padStart(4, "0")}ZXQ`;
			terms.push([token, canonical ?? term]);
			return token;
		});
	}
	return { text, terms };
}

function restore(value, terms) {
	let restored = value;
	for (let index = terms.length - 1; index >= 0; index--) {
		const [token, term] = terms[index];
		restored = restored.replaceAll(token, term);
	}
	return restored;
}

function escapeRegExp(value) {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
