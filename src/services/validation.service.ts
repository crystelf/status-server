import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ReportPayloadDto } from '../dto';

@Injectable()
export class ValidationService {
  private readonly logger = new Logger(ValidationService.name);

  /**
   * Validate report payload
   * Requirements: 3.2, 3.4
   */
  validateReportPayload(payload: any): ReportPayloadDto {
    const errors: string[] = [];

    // Validate top-level required fields
    if (!payload.clientId || typeof payload.clientId !== 'string') {
      errors.push('clientId is required and must be a string');
    }

    if (!payload.clientName || typeof payload.clientName !== 'string') {
      errors.push('clientName is required and must be a string');
    }

    if (!Array.isArray(payload.clientTags)) {
      errors.push('clientTags is required and must be an array');
    }

    if (typeof payload.clientPurpose !== 'string') {
      errors.push('clientPurpose must be a string');
    }

    if (!payload.hostname || typeof payload.hostname !== 'string') {
      errors.push('hostname is required and must be a string');
    }

    if (!payload.platform || typeof payload.platform !== 'string') {
      errors.push('platform is required and must be a string');
    }

    if (!payload.staticInfo || typeof payload.staticInfo !== 'object') {
      errors.push('staticInfo is required and must be an object');
    } else {
      this.validateStaticInfo(payload.staticInfo, errors);
    }

    if (!payload.dynamicStatus || typeof payload.dynamicStatus !== 'object') {
      errors.push('dynamicStatus is required and must be an object');
    } else {
      this.validateDynamicStatus(payload.dynamicStatus, errors);
    }

    if (errors.length > 0) {
      this.logger.warn(`Validation failed: ${errors.join(', ')}`);
      throw new BadRequestException({
        message: 'Validation failed',
        errors,
      });
    }

    return payload as ReportPayloadDto;
  }

  /**
   * Validate static system info
   */
  private validateStaticInfo(staticInfo: any, errors: string[]): void {
    if (typeof staticInfo.cpuModel !== 'string') {
      errors.push('staticInfo.cpuModel must be a string');
    }

    if (typeof staticInfo.cpuCores !== 'number' || staticInfo.cpuCores <= 0) {
      errors.push('staticInfo.cpuCores must be a positive number');
    }

    if (typeof staticInfo.cpuArch !== 'string') {
      errors.push('staticInfo.cpuArch must be a string');
    }

    if (typeof staticInfo.systemVersion !== 'string') {
      errors.push('staticInfo.systemVersion must be a string');
    }

    if (typeof staticInfo.systemModel !== 'string') {
      errors.push('staticInfo.systemModel must be a string');
    }

    if (typeof staticInfo.totalMemory !== 'number' || staticInfo.totalMemory < 0) {
      errors.push('staticInfo.totalMemory must be a non-negative number');
    }

    if (typeof staticInfo.totalSwap !== 'number' || staticInfo.totalSwap < 0) {
      errors.push('staticInfo.totalSwap must be a non-negative number');
    }

    if (typeof staticInfo.totalDisk !== 'number' || staticInfo.totalDisk < 0) {
      errors.push('staticInfo.totalDisk must be a non-negative number');
    }

    if (!Array.isArray(staticInfo.disks)) {
      errors.push('staticInfo.disks must be an array');
    } else {
      // Validate each disk in the array
      for (let i = 0; i < staticInfo.disks.length; i++) {
        const disk = staticInfo.disks[i];
        if (typeof disk.device !== 'string') {
          errors.push(`staticInfo.disks[${i}].device must be a string`);
        }
        if (typeof disk.size !== 'number' || disk.size < 0) {
          errors.push(`staticInfo.disks[${i}].size must be a non-negative number`);
        }
        if (typeof disk.type !== 'string') {
          errors.push(`staticInfo.disks[${i}].type must be a string`);
        }
      }
    }

    if (typeof staticInfo.location !== 'string') {
      errors.push('staticInfo.location must be a string');
    }
  }

  /**
   * Validate dynamic system status
   */
  private validateDynamicStatus(dynamicStatus: any, errors: string[]): void {
    if (
      typeof dynamicStatus.cpuUsage !== 'number' ||
      dynamicStatus.cpuUsage < 0 ||
      dynamicStatus.cpuUsage > 100
    ) {
      errors.push('dynamicStatus.cpuUsage must be a number between 0 and 100');
    }

    if (typeof dynamicStatus.cpuFrequency !== 'number' || dynamicStatus.cpuFrequency < 0) {
      errors.push('dynamicStatus.cpuFrequency must be a non-negative number');
    }

    if (
      typeof dynamicStatus.memoryUsage !== 'number' ||
      dynamicStatus.memoryUsage < 0 ||
      dynamicStatus.memoryUsage > 100
    ) {
      errors.push('dynamicStatus.memoryUsage must be a number between 0 and 100');
    }

    if (
      typeof dynamicStatus.swapUsage !== 'number' ||
      dynamicStatus.swapUsage < 0 ||
      dynamicStatus.swapUsage > 100
    ) {
      errors.push('dynamicStatus.swapUsage must be a number between 0 and 100');
    }

    if (
      typeof dynamicStatus.diskUsage !== 'number' ||
      dynamicStatus.diskUsage < 0 ||
      dynamicStatus.diskUsage > 100
    ) {
      errors.push('dynamicStatus.diskUsage must be a number between 0 and 100');
    }

    if (!Array.isArray(dynamicStatus.diskUsages)) {
      errors.push('dynamicStatus.diskUsages must be an array');
    } else {
      // Validate each disk usage in the array
      for (let i = 0; i < dynamicStatus.diskUsages.length; i++) {
        const diskUsage = dynamicStatus.diskUsages[i];
        if (typeof diskUsage.device !== 'string') {
          errors.push(`dynamicStatus.diskUsages[${i}].device must be a string`);
        }
        if (typeof diskUsage.size !== 'number' || diskUsage.size < 0) {
          errors.push(`dynamicStatus.diskUsages[${i}].size must be a non-negative number`);
        }
        if (typeof diskUsage.used !== 'number' || diskUsage.used < 0) {
          errors.push(`dynamicStatus.diskUsages[${i}].used must be a non-negative number`);
        }
        if (typeof diskUsage.available !== 'number' || diskUsage.available < 0) {
          errors.push(`dynamicStatus.diskUsages[${i}].available must be a non-negative number`);
        }
        if (
          typeof diskUsage.usagePercent !== 'number' ||
          diskUsage.usagePercent < 0 ||
          diskUsage.usagePercent > 100
        ) {
          errors.push(
            `dynamicStatus.diskUsages[${i}].usagePercent must be a number between 0 and 100`,
          );
        }
      }
    }

    if (typeof dynamicStatus.networkUpload !== 'number' || dynamicStatus.networkUpload < 0) {
      errors.push('dynamicStatus.networkUpload must be a non-negative number');
    }

    if (typeof dynamicStatus.networkDownload !== 'number' || dynamicStatus.networkDownload < 0) {
      errors.push('dynamicStatus.networkDownload must be a non-negative number');
    }

    if (typeof dynamicStatus.timestamp !== 'number' || dynamicStatus.timestamp <= 0) {
      errors.push('dynamicStatus.timestamp must be a positive number');
    }
  }

  /**
   * Validate history query parameters
   */
  validateHistoryQuery(clientId: string, startTime: any, endTime: any): void {
    const errors: string[] = [];

    if (!clientId) {
      errors.push('clientId is required and must be a string');
    }

    const start = Number(startTime);
    const end = Number(endTime);

    if (isNaN(start) || start <= 0) {
      errors.push('startTime must be a valid positive timestamp');
    }

    if (isNaN(end) || end <= 0) {
      errors.push('endTime must be a valid positive timestamp');
    }

    if (!isNaN(start) && !isNaN(end) && start >= end) {
      errors.push('startTime must be less than endTime');
    }

    if (errors.length > 0) {
      this.logger.warn(`History query validation failed: ${errors.join(', ')}`);
      throw new BadRequestException({
        message: 'Invalid query parameters',
        errors,
      });
    }
  }
}
