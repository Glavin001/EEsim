/**
 * SPICE simulation
 */
import * as circuits from "./circuits";
import Module from "./spice";

import readOutput, { ResultType } from "./readOutput";

//export { ResultType };

export default class Simulation {
  private pass = false;
  //const commandList = [" ", "source test.cir", "run", "set filetype=ascii", "write out.raw"];
  private commandList = [" ", "source test.cir", "run", "write out.raw"];
  private cmd = 0;
  private dataRaw = new Uint8Array();
  private results = {} as ResultType;
  private output = "";

  private netList = "";

  private getInput = (): string => {
    let strCmd = " ";
    if (this.cmd < this.commandList.length) {
      strCmd = this.commandList[this.cmd];
      this.cmd++;
    } else {
      this.cmd = 0;
    }
    console.log(`cmd -> ${strCmd}`);
    return strCmd;
  };

  public async start(): Promise<void> {
    const module = await Module({
      //arguments: ["test.cir"],
      noInitialRun: true,
      print: (e) => {
        /*do nothing*/
        console.log(e);
      },
      preRun: [
        () => {
          console.log("from prerun");
        },
      ],
      setGetInput: this.getInput,
      setHandleThings: () => {
        /** */
      },
      runThings: () => {
        /** */
      },
    });

    module.FS?.writeFile("/proc/meminfo", "");
    module.FS?.writeFile("/modelcard.CMOS90", circuits.strModelCMOS90);
    //module.FS.writeFile("/test.cir", circuits.bsimTrans);
    //console.log(module.Asyncify);

    module.setHandleThings(() => {
      console.log("handle other things!!!!!");
      module.Asyncify?.handleAsync(async () => {
        console.log(this.pass);
        if (this.cmd == 0) {
          try {
            this.dataRaw = module.FS?.readFile("out.raw") ?? new Uint8Array();
            this.results = readOutput(this.dataRaw);
            this.outputEvent(this.output); //callback
          } catch (e) {
            console.log(e);
          }

          console.log("cmd-> ready to start...");
          //pass = false;
        }
        while (!this.pass && this.cmd == 0) {
          //console.log(chkPass());
          await new Promise((r) => setTimeout(r, 1000));
          console.log(`I am in pass loop JS -${this.pass} `);
        }
        module.FS?.writeFile("/test.cir", this.netList);

        console.log("loop finished");

        this.pass = false;
      });
    });
    module.setGetInput(this.getInput);

    module.runThings();
  }

  public runSim(): void {
    this.pass = true;
  }

  //private outputEvent =  (out: string) => void;
  private outputEvent = (out: string) => {
    /** */
  };

  public setNetList = (input: string): void => {
    this.netList = input;
  };

  public setOutputEvent = (outputEvent: (out: string) => void): void => {
    this.outputEvent = outputEvent;
  };
  public getResults = (): ResultType => {
    return this.results;
  };
}