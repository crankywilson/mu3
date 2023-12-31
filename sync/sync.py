msgs = '../server/Msgs/*.cs'
output = '../client/js/types.js'
uioutput = '../client/js/game.js'
uiinput = '../client/index.htm'

classFiles = [ 
  '../server/Player.cs',
  '../server/LandLot.cs',
  '../server/Game.cs'
]

typemappings = {
  'int': 'number',
  'double': 'number',
  'float': 'number',
  'string': 'string',
  'bool': 'boolean',
  'PlayerColor': 'string',
}

types = {}
currec = None
recentrec = None
curfields = []
linenum = 0
gamestates = []
recvtypes = {}
elementsWithID : dict[str,str] = {}

import re, subprocess, sys, os, traceback, glob, html.parser

class TagParser(html.parser.HTMLParser):
    def handle_starttag(self, tag, attrs):
        attr = dict(attrs)
        if 'id' in attr and attr['id'] is not None:
          elementsWithID[attr['id']] = tag

parser = TagParser()

def lf(t):
  if t=="div": return "div"
  if t=="select": return "sel"
  if t=="input": return "inp"
  if t=="button": return "btn"
  return "e"

def typemapping(cstype : str):
  retVal = None
  useArray = False
  useNullable = False

  if cstype.endswith('?'):
    useNullable = True
    cstype = cstype.replace('?', '')
  if cstype.endswith('[]'):
    useArray = True
    cstype = cstype.replace('[]', '')
  if cstype.startswith('List<'):
    useArray = True
    cstype = cstype.replace(' ', '')
    cstype = cstype.replace('List<', '')
    cstype = cstype.replace('>', '')

  if cstype not in typemappings:
    retVal = cstype
  else:
    retVal = typemappings[cstype]
  if useNullable:
    retVal += '?'
  if useArray:
    retVal += '[]'
  return retVal


def bad(msg : str):
  print(msg, file=sys.stderr)
  subprocess.Popen("paplay /usr/share/sounds/freedesktop/stereo/service-logout.oga", shell=True)
  exit(1)

def good(msg : str):
  print(msg)
  subprocess.Popen("paplay /usr/share/sounds/freedesktop/stereo/complete.oga", shell=True)

def RYGBfunctions(elementsWithID : dict[str, str]):
  ret = ""
  for k in elementsWithID:
    if k.startswith("r"):
      k = k[1:]
      if "y" + k in elementsWithID and \
         "g" + k in elementsWithID and \
         "b" + k in elementsWithID:
        ret += f"  {k}: function(/**@type {{string}}*/clr) {{ if (clr == 'R') return ui.r{k}; if (clr == 'Y') return ui.y{k}; if (clr == 'G') return ui.g{k}; return ui.b{k}; }},\n"

  return ret

try:
  os.chdir(os.path.dirname(os.path.abspath(sys.argv[0])))
  for inputFile in glob.glob(msgs):
    with open(inputFile) as f:
      linenum = 0
      for lin in f.readlines():
        linenum += 1
        toks = lin.split()
        if currec is None:
          if len(toks) > 2 and toks[0] == 'record' and toks[2][0] == '(':
            currec = toks[1]
            recentrec = currec
            curfields = []
            types[currec] = curfields
            if currec == 'Msg' or re.search(r"\).*:\s*Msg\W*;", lin):
              currec = None              
          else:
            if lin.find(' OnPreGameRecv') > 0 or lin.find(' OnRecv') > 0:
              if recentrec != 'Msg':
                recvtypes[recentrec] = True
        else: # processing currec
          if len(toks) == 0:
            continue
          if toks[0][0] == '/':
            continue
          if toks[0] == 'record':
            bad(f'Encounterred record on line {linenum}  of {inputFile} before finding end of record {currec}')
          if toks[0][0] == ')':
            currec = None
            continue
          else:
            if len(toks) < 2:
              bad(f'Expected at least two tokens on line {linenum} of {inputFile}')
            fieldNameMatch = re.match(r'^[a-zA-Z0-9_]*', toks[1])
            if fieldNameMatch is None:
              bad(f'Expected a field name on line {linenum} of {inputFile} (but found none)')
              exit(1)
            fieldName = fieldNameMatch.group()
            fieldType = toks[0]
            maptype = typemapping(fieldType)
            if maptype is None:
              bad(f'Unknown type "{fieldType}" on line {linenum} of {inputFile}')
            else:
              curfields.append("{" + maptype + "} " + fieldName)

    if currec is not None:
      bad(f'Encountered end of file without finding end of {currec} in {inputFile}')

  # Now define classes according to different rules
  classNames = []
  for inputfile in classFiles:
    curfields = []
    className = "?"
    with open(inputfile) as f:
      for lin in f.readlines():
        toks = lin.split()
        if len(toks) == 2 and toks[0] == 'class':
          if len(curfields) > 0:
            types[className] = curfields
            curfields = []
          className = toks[1]
          classNames.append(className)
        if len(toks) > 1 and toks[0] == '/*GS*/':
          gamestates.append(toks[1])
        if len(toks) > 3 and toks[0] == '[JsonInclude]' and toks[1] == 'public':
          fieldName = toks[3].replace(';','')
          fieldType = toks[2]
          maptype = typemapping(fieldType)
          if maptype is None:
            bad(f'Unknown type "{fieldType}" in {inputfile}')
          else:
            curfields.append("{" + maptype + "} " + fieldName) 
    if len(curfields) > 0:
      types[className] = curfields

  with open(output, 'w') as f:
    f.write('// autogenerated\n\n/**\n\n')
    for m in types:
      f.write(f'@typedef {m}\n')
      for fld in types[m]:
        f.write(f' @property {fld}\n')
      if m not in classNames:
        f.write(' @property {string} _mt\n')
      f.write('\n')
    if len(gamestates) > 0:
      f.write('@typedef {(\n')
      for gs in gamestates:
        f.write(" '" + gs + "'|\n")
      f.write(" '?')} GameState\n\n")
    f.write('@typedef {Object.<string, LandLot>} LandLotDict\n*/\n\n')
    
    if len(gamestates) == 0:
      f.write('export {}\n')
    else:
      f.write('export let GAMESTATE = {\n')
      for gs in gamestates:
        f.write(' ' + gs + ': "' + gs + '",\n')
      f.write(' UNKNOWN: "?"\n}\n')

    for m in recvtypes:
      f.write("/**@returns {" + m + "}*/ export function " + m + "(\n")
      for fld in types[m]:
        f.write(f' /**@type {fld.replace("}","}*/")},\n')
      f.write(") { return { _mt: '" + m + "'")
      for fld in types[m]:
        var = fld.split('}')[-1]
        f.write(f" ,{var}:{var}\n")
      f.write("};}\n\n")
  
  good(f"Successfully wrote {os.path.abspath(output)}")

# here's where we determine all of the html elements with ids:
  with open(uiinput) as f:
      data = f.read()
      parser.feed(data)

  startcomment = "/* autogenerated ui: */"
  endcomment = "/* end autogenerated ui */"
  new = ""

# write HTML id elements to uioutput inbetween startcomment and endcomment
  with open(uioutput) as f:
      old = f.read()
      startreplace = old.find(startcomment)
      if startreplace < 0: bad(f"Couldn't find '{startcomment}' in {uiinput}")
      stopreplace = old.find(endcomment)
      if stopreplace < 0: bad(f"Couldn't find '{endcomment}' in {uiinput}")

      new = old[0:startreplace]
      new += startcomment + "\nexport let ui =\n{\n"
      for e, t in elementsWithID.items():
          new += f"  {e}: {lf(t)}('{e}'),\n"
      new += RYGBfunctions(elementsWithID)
      new += "}\n"
      new += old[stopreplace:]

  with open(uioutput, 'w') as f:
    f.write(new)

  print(f"Updated {uioutput}")


except Exception as e:
  traceback.print_exc()
  bad("(Exception encounterred)")

