import { execFile } from 'child_process';
import { NotificationProvider } from './interface';
import { NotificationPayload, SendResult } from '../types';

export interface FloatingWindowStyle {
  fontSize?: number;
  fontFamily?: string;
  bgColor?: string;
  textColor?: string;
  opacity?: number;
  duration?: number;
  position?: string;
  width?: number;
}

/**
 * Custom floating window notification provider.
 * Launches a PowerShell script that renders a styled overlay window.
 */
export class FloatingWindowProvider implements NotificationProvider {
  readonly id = 'floating-window';
  readonly name = '浮动窗口';
  readonly description = '自定义样式浮动窗口（右下角弹出，类似 notify.ps1）';

  private style: FloatingWindowStyle = {};

  async initialize(config: Record<string, unknown>): Promise<void> {
    this.style = {
      fontSize: (config.fontSize as number) ?? 9,
      fontFamily: (config.fontFamily as string) ?? 'Microsoft YaHei',
      bgColor: (config.bgColor as string) ?? '#323232',
      textColor: (config.textColor as string) ?? '#ffffff',
      opacity: (config.opacity as number) ?? 0.95,
      duration: (config.duration as number) ?? 4,
      position: (config.position as string) ?? 'bottom-right',
      width: (config.width as number) ?? 340,
    };
  }

  async send(notification: NotificationPayload): Promise<SendResult> {
    return new Promise((resolve) => {
      const psScript = this.buildScript(notification.title ?? 'Claude Code', notification.message);

      execFile(
        'powershell',
        ['-ExecutionPolicy', 'Bypass', '-Command', psScript],
        { timeout: 15000 },
        (err) => {
          if (err) {
            resolve({ success: false, providerId: this.id, error: err.message });
          } else {
            resolve({ success: true, providerId: this.id });
          }
        },
      );
    });
  }

  private buildScript(title: string, body: string): string {
    const s = this.style;
    const titleSafe = title
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n');
    const bodySafe = body
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n');

    const posCode = this.getPositionCode(s.position ?? 'bottom-right', s.width ?? 340);

    return `
Add-Type -AssemblyName System.Windows.Forms,System.Drawing
$f=New-Object System.Windows.Forms.Form;$f.Text='';$f.Width=${s.width};$f.Height=62
$f.ControlBox=$false;$f.ShowInTaskbar=$false;$f.TopMost=$true
$f.FormBorderStyle='None'
$f.BackColor=[System.Drawing.Color]::FromArgb(50,50,50)
$f.Opacity=${s.opacity};$f.StartPosition='Manual'
${posCode}
$l=New-Object System.Windows.Forms.Label
$l.Text="${titleSafe}\`n${bodySafe}"
$l.Font=New-Object System.Drawing.Font("${s.fontFamily}",${s.fontSize})
$l.ForeColor=[System.Drawing.Color]::FromArgb(255,255,255)
$l.AutoSize=$false;$l.Width=${(s.width ?? 340) - 20};$l.Height=44
$l.Location=New-Object System.Drawing.Point(10,8)
$f.Controls.Add($l)
$f.Show()
$until=[DateTime]::Now.AddSeconds(${s.duration})
while([DateTime]::Now -lt $until -and $f.Visible){[System.Windows.Forms.Application]::DoEvents();Start-Sleep -Milliseconds 100}
$f.Close()
`.trim();
  }

  private getPositionCode(pos: string, width: number): string {
    const screenW = '[System.Windows.Forms.Screen]::PrimaryScreen.WorkingArea.Width';
    const screenH = '[System.Windows.Forms.Screen]::PrimaryScreen.WorkingArea.Height';
    const wH = '80';
    const margin = '10';

    switch (pos) {
      case 'bottom-left':
        return `$f.Location=New-Object System.Drawing.Point(${margin},${screenH}-${wH})`;
      case 'top-right':
        return `$f.Location=New-Object System.Drawing.Point(${screenW}-${width}-${margin},${margin})`;
      case 'top-left':
        return `$f.Location=New-Object System.Drawing.Point(${margin},${margin})`;
      case 'bottom-right':
      default:
        return `$f.Location=New-Object System.Drawing.Point(${screenW}-${width}-${margin},${screenH}-${wH})`;
    }
  }
}
