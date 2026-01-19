import { http } from "./http";

function buildParams(from?: string, to?: string) {
  const params: any = {};
  if (from) params.from = from;
  if (to) params.to = to;
  return params;
}

export async function getClassroomReportPdf(classroomId: string, from?: string, to?: string): Promise<Blob> {
  const res = await http.get(`/api/v1/reports/classroom/${classroomId}`, {
    params: buildParams(from, to),
    responseType: "blob",
  });
  return res.data as Blob;
}

export async function getUserReportPdf(userId: string, from?: string, to?: string): Promise<Blob> {
  const res = await http.get(`/api/v1/reports/user/${userId}`, {
    params: buildParams(from, to),
    responseType: "blob",
  });
  return res.data as Blob;
}
