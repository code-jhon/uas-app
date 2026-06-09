import { getDatabase } from './database';
import { Checklist, ChecklistExecution, ChecklistItemResult, ChecklistSection, ChecklistItem } from '../types';
import { randomUUID } from '../utils/uuid';

// ─── Read ─────────────────────────────────────────────────────────────────────

export async function getChecklists(templatesOnly = false): Promise<Checklist[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    `SELECT * FROM checklist${templatesOnly ? ' WHERE is_template = 1' : ''} ORDER BY is_template DESC, name`
  );
  const checklists: Checklist[] = [];
  for (const row of rows) {
    const sections = await getSections(row.id as string);
    checklists.push({
      id: row.id as string,
      name: row.name as string,
      description: (row.description as string) ?? undefined,
      isTemplate: (row.is_template as number) === 1,
      parentTemplateId: (row.parent_template_id as string) ?? undefined,
      sections,
      createdAt: row.created_at as string,
    });
  }
  return checklists;
}

export async function getChecklistById(id: string): Promise<Checklist | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<Record<string, unknown>>(
    `SELECT * FROM checklist WHERE id = ?`,
    [id]
  );
  if (!row) return null;
  const sections = await getSections(id);
  return {
    id: row.id as string,
    name: row.name as string,
    description: (row.description as string) ?? undefined,
    isTemplate: (row.is_template as number) === 1,
    parentTemplateId: (row.parent_template_id as string) ?? undefined,
    sections,
    createdAt: row.created_at as string,
  };
}

async function getSections(checklistId: string): Promise<ChecklistSection[]> {
  const db = await getDatabase();
  const sectionRows = await db.getAllAsync<Record<string, unknown>>(
    `SELECT * FROM checklist_section WHERE checklist_id = ? ORDER BY sort_order`,
    [checklistId]
  );
  const sections: ChecklistSection[] = [];
  for (const sec of sectionRows) {
    const items = await getItems(sec.id as string);
    sections.push({
      id: sec.id as string,
      checklistId,
      order: sec.sort_order as number,
      title: sec.title as string,
      items,
    });
  }
  return sections;
}

async function getItems(sectionId: string): Promise<ChecklistItem[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    `SELECT * FROM checklist_item WHERE section_id = ? ORDER BY sort_order`,
    [sectionId]
  );
  return rows.map((r) => ({
    id: r.id as string,
    sectionId,
    order: r.sort_order as number,
    title: r.title as string,
    description: (r.description as string) ?? undefined,
    required: (r.required as number) === 1,
    itemType: (r.item_type as 'check' | 'input' | 'number'),
  }));
}

// ─── Create / Clone ───────────────────────────────────────────────────────────

export async function cloneTemplate(templateId: string, newName: string): Promise<string> {
  const tmpl = await getChecklistById(templateId);
  if (!tmpl) throw new Error('Template not found');

  const db = await getDatabase();
  const newId = randomUUID();
  await db.runAsync(
    `INSERT INTO checklist (id, name, description, is_template, parent_template_id, created_at) VALUES (?,?,?,0,?,?)`,
    [newId, newName, tmpl.description ?? null, templateId, new Date().toISOString()]
  );

  for (const sec of tmpl.sections) {
    const secId = randomUUID();
    await db.runAsync(
      `INSERT INTO checklist_section (id, checklist_id, sort_order, title) VALUES (?,?,?,?)`,
      [secId, newId, sec.order, sec.title]
    );
    for (const item of sec.items) {
      await db.runAsync(
        `INSERT INTO checklist_item (id, section_id, sort_order, title, description, required, item_type) VALUES (?,?,?,?,?,?,?)`,
        [randomUUID(), secId, item.order, item.title, item.description ?? null, item.required ? 1 : 0, item.itemType]
      );
    }
  }
  return newId;
}

export async function createChecklist(
  name: string,
  description?: string,
  sections?: Array<{ title: string; items: Array<{ title: string; description?: string; required?: boolean }> }>
): Promise<string> {
  const db = await getDatabase();
  const id = randomUUID();
  await db.runAsync(
    `INSERT INTO checklist (id, name, description, is_template, created_at) VALUES (?,?,?,0,?)`,
    [id, name, description ?? null, new Date().toISOString()]
  );

  for (let si = 0; si < (sections ?? []).length; si++) {
    const sec = sections![si];
    const secId = randomUUID();
    await db.runAsync(
      `INSERT INTO checklist_section (id, checklist_id, sort_order, title) VALUES (?,?,?,?)`,
      [secId, id, si, sec.title]
    );
    for (let ii = 0; ii < sec.items.length; ii++) {
      const item = sec.items[ii];
      await db.runAsync(
        `INSERT INTO checklist_item (id, section_id, sort_order, title, description, required, item_type) VALUES (?,?,?,?,?,?,?)`,
        [randomUUID(), secId, ii, item.title, item.description ?? null, item.required !== false ? 1 : 0, 'check']
      );
    }
  }
  return id;
}

export async function deleteChecklist(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`DELETE FROM checklist WHERE id = ? AND is_template = 0`, [id]);
}

// ─── Executions ───────────────────────────────────────────────────────────────

export async function startExecution(checklistId: string, checklistName: string): Promise<string> {
  const db = await getDatabase();
  const id = randomUUID();
  await db.runAsync(
    `INSERT INTO checklist_execution (id, checklist_id, checklist_name, started_at) VALUES (?,?,?,?)`,
    [id, checklistId, checklistName, new Date().toISOString()]
  );
  return id;
}

export async function saveItemResult(result: Omit<ChecklistItemResult, 'id' | 'timestamp'>): Promise<void> {
  const db = await getDatabase();
  // upsert by execution_id + item_id
  const existing = await db.getFirstAsync<{ id: string }>(
    `SELECT id FROM checklist_item_result WHERE execution_id = ? AND item_id = ?`,
    [result.executionId, result.itemId]
  );
  if (existing) {
    await db.runAsync(
      `UPDATE checklist_item_result SET status=?, note=?, value=?, timestamp=? WHERE id=?`,
      [result.status, result.note ?? null, result.value ?? null, new Date().toISOString(), existing.id]
    );
  } else {
    await db.runAsync(
      `INSERT INTO checklist_item_result (id, execution_id, item_id, status, note, value, timestamp) VALUES (?,?,?,?,?,?,?)`,
      [randomUUID(), result.executionId, result.itemId, result.status, result.note ?? null, result.value ?? null, new Date().toISOString()]
    );
  }
}

export async function completeExecution(executionId: string, linkedFlightId?: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE checklist_execution SET completed_at=?, linked_flight_id=? WHERE id=?`,
    [new Date().toISOString(), linkedFlightId ?? null, executionId]
  );
}

export async function getExecutions(flightId?: string): Promise<ChecklistExecution[]> {
  const db = await getDatabase();
  const rows = flightId
    ? await db.getAllAsync<Record<string, unknown>>(
        `SELECT * FROM checklist_execution WHERE linked_flight_id = ? ORDER BY started_at DESC`,
        [flightId]
      )
    : await db.getAllAsync<Record<string, unknown>>(
        `SELECT * FROM checklist_execution ORDER BY started_at DESC LIMIT 50`
      );

  const executions: ChecklistExecution[] = [];
  for (const row of rows) {
    const results = await db.getAllAsync<Record<string, unknown>>(
      `SELECT * FROM checklist_item_result WHERE execution_id = ?`,
      [row.id as string]
    );
    executions.push({
      id: row.id as string,
      checklistId: row.checklist_id as string,
      checklistName: row.checklist_name as string,
      startedAt: row.started_at as string,
      completedAt: (row.completed_at as string) ?? undefined,
      linkedFlightId: (row.linked_flight_id as string) ?? undefined,
      results: results.map((r) => ({
        id: r.id as string,
        executionId: row.id as string,
        itemId: r.item_id as string,
        status: r.status as ChecklistItemResult['status'],
        note: (r.note as string) ?? undefined,
        value: (r.value as string) ?? undefined,
        timestamp: r.timestamp as string,
      })),
    });
  }
  return executions;
}
