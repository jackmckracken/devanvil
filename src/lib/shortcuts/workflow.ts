import { randomUUID } from "node:crypto";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildPlistValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "<string></string>";
  }
  if (typeof value === "string") {
    return `<string>${escapeXml(value)}</string>`;
  }
  if (typeof value === "number") {
    return Number.isInteger(value)
      ? `<integer>${value}</integer>`
      : `<real>${value}</real>`;
  }
  if (typeof value === "boolean") {
    return value ? "<true/>" : "<false/>";
  }
  if (Array.isArray(value)) {
    return `<array>${value.map((item) => buildPlistValue(item)).join("")}</array>`;
  }
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .map(
        ([key, item]) =>
          `<key>${escapeXml(key)}</key>${buildPlistValue(item)}`,
      )
      .join("");
    return `<dict>${entries}</dict>`;
  }
  return `<string>${escapeXml(String(value))}</string>`;
}

function buildPlist(obj: Record<string, unknown>): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">${buildPlistValue(obj)}</plist>`;
}

type Platform = "ios" | "macos";

type WorkflowAction = {
  WFWorkflowActionIdentifier: string;
  WFWorkflowActionParameters: Record<string, unknown>;
  WFWorkflowActionOutputUUID?: string;
};

function uuid(): string {
  return randomUUID();
}

function textToken(value: string) {
  return {
    Value: {
      attachmentsByRange: {},
      string: value,
    },
    WFSerializationType: "WFTextTokenString",
  };
}

function variableRef(name: string) {
  return {
    Value: {
      OutputName: name,
      Type: "Variable",
      VariableName: name,
    },
  };
}

function action(
  identifier: string,
  parameters: Record<string, unknown>,
): WorkflowAction {
  return {
    WFWorkflowActionIdentifier: identifier,
    WFWorkflowActionParameters: parameters,
    WFWorkflowActionOutputUUID: uuid(),
  };
}

function buildWorkflowActions(platform: Platform, apiUrl: string): WorkflowAction[] {
  const platformLabel = platform === "ios" ? "ios" : "macos";
  const configUrl = `${apiUrl}/api/shortcuts/config`;
  const intakeUrl = `${apiUrl}/api/dev-intake`;

  return [
    action("is.workflow.actions.comment", {
      WFCommentActionText: `DevAnvil capture (${platformLabel}). Config fetched at runtime.`,
    }),
    action("is.workflow.actions.setvariable", {
      WFVariable: "DEVANVIL_API_URL",
      WFInput: textToken(apiUrl),
    }),
    action("is.workflow.actions.getvariable", {
      WFVariable: "DEVANVIL_INGEST_TOKEN",
    }),
    action("is.workflow.actions.conditional", {
      WFControlFlowMode: 0,
      WFCondition: 101,
      WFInput: variableRef("DEVANVIL_INGEST_TOKEN"),
    }),
    action("is.workflow.actions.ask", {
      WFAskActionPrompt: "Enter your DevAnvil API Key",
      WFInputType: "Text",
    }),
    action("is.workflow.actions.setvariable", {
      WFVariable: "DEVANVIL_INGEST_TOKEN",
    }),
    action("is.workflow.actions.conditional", {
      WFControlFlowMode: 2,
    }),
    action("is.workflow.actions.getitemtype", {
      WFInput: { Value: { Type: "ShortcutInput" } },
    }),
    action("is.workflow.actions.conditional", {
      WFControlFlowMode: 0,
      WFCondition: 4,
      WFInput: variableRef("Item Type"),
      WFConditionalActionString: "Image",
    }),
    action("is.workflow.actions.extracttext", {
      WFInput: { Value: { Type: "ShortcutInput" } },
    }),
    action("is.workflow.actions.setvariable", {
      WFVariable: "CaptureText",
    }),
    action("is.workflow.actions.setvariable", {
      WFVariable: "SourceType",
      WFInput: textToken("screenshot"),
    }),
    action("is.workflow.actions.conditional", {
      WFControlFlowMode: 1,
    }),
    action("is.workflow.actions.conditional", {
      WFControlFlowMode: 0,
      WFCondition: 4,
      WFInput: variableRef("Item Type"),
      WFConditionalActionString: "URL",
    }),
    action("is.workflow.actions.gettext", {
      WFInput: { Value: { Type: "ShortcutInput" } },
    }),
    action("is.workflow.actions.setvariable", {
      WFVariable: "CaptureText",
    }),
    action("is.workflow.actions.setvariable", {
      WFVariable: "SourceType",
      WFInput: textToken("url"),
    }),
    action("is.workflow.actions.conditional", {
      WFControlFlowMode: 1,
    }),
    action("is.workflow.actions.gettext", {
      WFInput: { Value: { Type: "ShortcutInput" } },
    }),
    action("is.workflow.actions.setvariable", {
      WFVariable: "CaptureText",
    }),
    action("is.workflow.actions.setvariable", {
      WFVariable: "SourceType",
      WFInput: textToken("text"),
    }),
    action("is.workflow.actions.conditional", {
      WFControlFlowMode: 2,
    }),
    action("is.workflow.actions.downloadurl", {
      WFURL: textToken(configUrl),
      ShowHeaders: false,
      WFHTTPMethod: "GET",
    }),
    action("is.workflow.actions.getvalueforkey", {
      WFDictionaryKey: "defaultProject",
    }),
    action("is.workflow.actions.setvariable", {
      WFVariable: "ProjectHint",
    }),
    action("is.workflow.actions.format.date", {
      WFDateFormatStyle: "ISO 8601",
      WFISO8601IncludeTime: true,
    }),
    action("is.workflow.actions.setvariable", {
      WFVariable: "SharedAt",
    }),
    action("is.workflow.actions.dictionary", {
      WFItems: {
        Value: {
          WFDictionaryFieldValueItems: [
            {
              WFKey: textToken("text"),
              WFItemType: 0,
              WFValue: variableRef("CaptureText"),
            },
            {
              WFKey: textToken("sourceType"),
              WFItemType: 0,
              WFValue: variableRef("SourceType"),
            },
            {
              WFKey: textToken("projectHint"),
              WFItemType: 0,
              WFValue: variableRef("ProjectHint"),
            },
            {
              WFKey: textToken("platform"),
              WFItemType: 0,
              WFValue: textToken(platformLabel),
            },
            {
              WFKey: textToken("sharedAt"),
              WFItemType: 0,
              WFValue: variableRef("SharedAt"),
            },
          ],
        },
        WFSerializationType: "WFDictionaryFieldValue",
      },
    }),
    action("is.workflow.actions.downloadurl", {
      WFURL: textToken(intakeUrl),
      ShowHeaders: false,
      WFHTTPMethod: "POST",
      WFHTTPHeaders: {
        Value: {
          WFDictionaryFieldValueItems: [
            {
              WFKey: textToken("Authorization"),
              WFItemType: 0,
              WFValue: {
                Value: {
                  attachmentsByRange: {
                    "{0, 1}": { string: "Bearer " },
                    "{1, 1}": { Type: "Variable", VariableName: "DEVANVIL_INGEST_TOKEN" },
                  },
                  string: "￼￼",
                },
                WFSerializationType: "WFTextTokenString",
              },
            },
            {
              WFKey: textToken("Content-Type"),
              WFItemType: 0,
              WFValue: textToken("application/json"),
            },
          ],
        },
        WFSerializationType: "WFDictionaryFieldValue",
      },
      WFJSONBody: {
        Value: { Type: "ActionOutput" },
      },
    }),
    action("is.workflow.actions.getvalueforkey", {
      WFDictionaryKey: "project",
    }),
    action("is.workflow.actions.getvalueforkey", {
      WFDictionaryKey: "itemType",
    }),
    action("is.workflow.actions.getvalueforkey", {
      WFDictionaryKey: "status",
    }),
    action("is.workflow.actions.getvalueforkey", {
      WFDictionaryKey: "itemId",
    }),
    action("is.workflow.actions.getvalueforkey", {
      WFDictionaryKey: "matches",
    }),
    action("is.workflow.actions.count", {
      WFCountType: "Items",
    }),
    action("is.workflow.actions.conditional", {
      WFControlFlowMode: 0,
      WFCondition: 2,
      WFNumberValue: 0,
    }),
    action("is.workflow.actions.text", {
      WFTextActionText: textToken(
        "✅ Captured by DevAnvil\n\nCheck Shortcuts result for details.",
      ),
    }),
    action("is.workflow.actions.conditional", {
      WFControlFlowMode: 1,
    }),
    action("is.workflow.actions.text", {
      WFTextActionText: textToken(
        "✅ Captured by DevAnvil\n\n⚠ Similar items found",
      ),
    }),
    action("is.workflow.actions.conditional", {
      WFControlFlowMode: 2,
    }),
    action("is.workflow.actions.showresult", {}),
    action("is.workflow.actions.notification", {
      WFNotificationActionTitle: "DevAnvil",
      WFNotificationActionBody: textToken("Captured by DevAnvil"),
    }),
  ];
}

function inputClasses(platform: Platform): string[] {
  if (platform === "ios") {
    return [
      "WFAppStoreAppContentItem",
      "WFArticleContentItem",
      "WFContactContentItem",
      "WFDateContentItem",
      "WFEmailAddressContentItem",
      "WFGenericFileContentItem",
      "WFImageContentItem",
      "WFiTunesProductContentItem",
      "WFLocationContentItem",
      "WFDCMapsLinkContentItem",
      "WFPDFContentItem",
      "WFPhoneNumberContentItem",
      "WFRichTextContentItem",
      "WFSafariWebPageContentItem",
      "WFStringContentItem",
      "WFURLContentItem",
    ];
  }

  return [
    "WFStringContentItem",
    "WFURLContentItem",
    "WFRichTextContentItem",
    "WFGenericFileContentItem",
    "WFImageContentItem",
  ];
}

export function buildShortcutPlist(platform: Platform, apiUrl: string): string {
  const workflow = {
    WFWorkflowActions: buildWorkflowActions(platform, apiUrl),
    WFWorkflowClientVersion: "2700.0.4",
    WFWorkflowHasOutputFallback: false,
    WFWorkflowIcon: {
      WFWorkflowIconGlyphNumber: 59511,
      WFWorkflowIconStartColor: 4282601983,
    },
    WFWorkflowImportQuestions: [],
    WFWorkflowInputContentItemClasses: inputClasses(platform),
    WFWorkflowMinimumClientVersion: 900,
    WFWorkflowMinimumClientVersionString: "900",
    WFWorkflowName:
      platform === "ios" ? "Send to DevAnvil" : "Send to DevAnvil (Mac)",
    WFWorkflowOutputContentItemClasses: [],
    WFWorkflowTypes:
      platform === "ios"
        ? ["ActionExtension", "WFWorkflowTypeShowInSearch"]
        : ["NCWidget", "WatchKit", "ActionExtension"],
    WFWorkflowHasShortcutInputVariables: true,
  };

  return buildPlist(workflow);
}

export function buildShortcutJson(platform: Platform, apiUrl: string) {
  return {
    name: platform === "ios" ? "Send to DevAnvil" : "Send to DevAnvil (Mac)",
    platform,
    apiUrl,
    version: "1",
    product: "devanvil",
    description:
      platform === "ios"
        ? "Capture ideas from anywhere via the iOS Share Sheet."
        : "Send selected text, links, notes, and screenshots to DevAnvil.",
    auth: {
      variable: "DEVANVIL_INGEST_TOKEN",
      prompt: "Enter your DevAnvil API Key",
      storage: "Shortcuts local storage",
    },
    endpoints: {
      config: `${apiUrl}/api/shortcuts/config`,
      intake: `${apiUrl}/api/dev-intake`,
    },
    payload: {
      text: "CaptureText",
      sourceType: "SourceType",
      projectHint: "from config.defaultProject",
      platform: platform === "ios" ? "ios" : "macos",
      sharedAt: "ISO8601 timestamp",
    },
    sourceTypeRules: [
      { input: "Image", sourceType: "screenshot", extractText: true },
      { input: "URL", sourceType: "url" },
      { fallback: "text" },
    ],
  };
}
