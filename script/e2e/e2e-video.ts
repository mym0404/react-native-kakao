import { setTimeout as sleep } from 'node:timers/promises';
import { $, fs, path, type ProcessPromise } from 'zx';

import { logCommand } from './e2e-log.ts';

export const recordVideo = async ({
  platform,
  device,
  output,
}: {
  platform: 'ios' | 'android';
  device: string;
  output: string;
}) => {
  const commandTimeoutMs = 10000;
  const ready = Promise.withResolvers<void>();
  const chunks: { file: string; remoteFile?: string; log: string; durationSeconds: number }[] = [];
  let command: ProcessPromise | undefined;
  let androidPid: string | undefined;
  let isStopping = false;
  const done = record().catch((cause: unknown) => {
    ready.reject(cause);
    throw cause;
  });
  done.catch(() => undefined);

  const startup = new AbortController();
  try {
    await Promise.race([
      ready.promise,
      sleep(commandTimeoutMs, undefined, { signal: startup.signal }).then(() => {
        throw new Error(
          `Whole-run recorder did not start within ${commandTimeoutMs / 1000} seconds`,
        );
      }),
    ]);
  } catch (cause) {
    await stop().catch(() => undefined);
    throw cause;
  } finally {
    startup.abort();
  }

  return stop;

  async function record() {
    do {
      const index = chunks.length;
      const file = path.resolve(output, `recording-${index}.mp4`);
      const started = performance.now();
      let remoteFile: string | undefined;
      if (platform === 'ios') {
        command = $`xcrun simctl io ${device} recordVideo --codec=h264 ${file}`
          .quiet()
          .nothrow()
          .timeout(720000, 'SIGINT');

        command.stderr.on('data', (data: Buffer) => {
          if (data.toString().includes('Recording started')) {
            ready.resolve();
          }
        });
      } else {
        remoteFile = `/sdcard/kakao-e2e-${process.pid}-${index}.mp4`;
        // Android screenrecord stops at 180 seconds; continue into the next owned chunk.
        command =
          $`adb -s ${device} shell ${`screenrecord --time-limit 180 --bit-rate 1000000 ${remoteFile} & recorder_pid=$!; echo $recorder_pid; wait $recorder_pid`}`
            .quiet()
            .nothrow()
            .timeout(190000, 'SIGKILL');

        let stdout = '';
        androidPid = undefined;
        command.stdout.on('data', (data: Buffer) => {
          stdout += data.toString();
          androidPid = /^(\d+)\r?\n/.exec(stdout)?.[1];
          if (androidPid) {
            ready.resolve();
          }
        });
      }

      const chunk = { file, remoteFile, log: '', durationSeconds: 0 };
      chunks.push(chunk);

      const result = await command;
      chunk.log = result.stdout + result.stderr;
      chunk.durationSeconds = (performance.now() - started) / 1000;

      if (!isStopping && (platform === 'ios' || result.exitCode !== 0)) {
        throw new Error(`Whole-run recorder stopped early: ${result.exitCode}`);
      }
    } while (!isStopping);
  }

  async function stop() {
    isStopping = true;

    try {
      try {
        const child = command?.child;
        if (command && child && child.exitCode === null && child.signalCode === null) {
          command.timeout(15000, 'SIGKILL');
          if (platform === 'android' && androidPid) {
            await $`adb -s ${device} shell kill -2 ${androidPid}`
              .quiet()
              .timeout(commandTimeoutMs)
              .nothrow();
          } else {
            await command.kill('SIGINT');
          }
        }
      } finally {
        await done;
      }

      for (const { file, remoteFile } of chunks) {
        if (remoteFile) {
          await $`adb -s ${device} pull ${remoteFile} ${file}`.quiet().timeout(30000);
        }
      }
    } finally {
      await Promise.all([
        fs.writeFile(
          path.resolve(output, 'recording.log'),
          chunks.map(({ log }) => log).join('\n'),
        ),
        ...chunks.map(({ remoteFile }) =>
          remoteFile
            ? $`adb -s ${device} shell rm -f ${remoteFile}`
                .quiet()
                .timeout(commandTimeoutMs)
                .nothrow()
            : undefined,
        ),
      ]);
    }

    const playlist = path.resolve(output, 'recording.txt');
    await fs.writeFile(
      playlist,
      chunks
        .map(
          ({ file, durationSeconds }) =>
            `file '${file.replaceAll("'", "'\\''")}'\nduration ${durationSeconds}`,
        )
        .join('\n'),
    );

    const video = path.resolve(output, 'video.mp4');
    const duration = chunks.reduce((seconds, chunk) => seconds + chunk.durationSeconds, 0);
    await logCommand(
      $`ffmpeg -y -f concat -safe 0 -i ${playlist} -vf ${`scale=720:-2,tpad=stop_mode=clone:stop_duration=${duration}`} -t ${duration} -r 15 -c:v libx264 -crf 28 -pix_fmt yuv420p -an -movflags +faststart ${video}`.timeout(
        180000,
        'SIGKILL',
      ),
      path.resolve(output, 'video.log'),
    );

    const bytes = await fs.readFile(video);
    if (bytes.length < 24 || bytes.subarray(4, 8).toString() !== 'ftyp') {
      throw new Error('Invalid whole-run video');
    }

    const videoSeconds = Number(
      (
        await $`ffprobe -v error -show_entries format=duration -of ${'default=noprint_wrappers=1:nokey=1'} ${video}`
          .quiet()
          .timeout(commandTimeoutMs)
      ).stdout.trim(),
    );

    if (!Number.isFinite(videoSeconds) || Math.abs(videoSeconds - duration) > 0.2) {
      throw new Error(`Whole-run video duration ${videoSeconds}s does not match ${duration}s`);
    }

    await fs.remove(playlist);
    for (const { file } of chunks) {
      await fs.remove(file);
    }

    return path.basename(video);
  }
};
