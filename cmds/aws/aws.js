const exec = require('await-exec')
module.exports =
    class AWS {
        async update_ip() {
            const { exec } = require('promisify-child-process');
            let ip = await exec('curl -s http://whatismyip.akamai.com/')
            let update = await exec('aws ec2 --profile terraform authorize-security-group-ingress --group-id "sg-0ea6c67c3c546ed22" --protocol tcp --port 22   --cidr '+ip.stdout+'/32  --output text')
            console.log(update);
        }
    }
