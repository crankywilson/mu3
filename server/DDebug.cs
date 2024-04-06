using System.Collections;
using System.Reflection;
using Microsoft.CodeAnalysis.CSharp.Scripting;

public class DDebug
{
    public class Globals
    {
        public Game g;
        public Globals(Game g) { this.g = g; }
    }

    static void DLoop()
    {
        while (true)
        {
            string? input = Console.ReadLine();
            if (input is not null)
            {
                try 
                {
                    Globals? globals = null;
                    if (Game.Map.ContainsKey("New Game"))
                        globals = new Globals(Game.Map["New Game"]);
                    var r = CSharpScript.EvaluateAsync(
                        input,
                        Microsoft.CodeAnalysis.Scripting.ScriptOptions.Default.AddReferences(
                            [ Assembly.GetExecutingAssembly() ]
                        ),
                        globals).Result;
                    string? t = r.GetType().Assembly.GetName().Name;
                    if (r is IEnumerable)
                    {
                        Console.WriteLine($"-> {r.GetType()}");
                        IEnumerable e = (IEnumerable)r;
                        int i = 0;
                        foreach (object o in e)
                        {
                            Console.WriteLine($"{i++}: {o}");
                        }
                        continue;
                    }
                    else if (t == "serv")
                    {
                        Console.WriteLine("->");
                        object? o = null;
                        foreach (var m in r.GetType().GetMembers())
                        {
                            switch (m.MemberType)
                            {
                                case MemberTypes.Field:
                                    o = ((FieldInfo)m).GetValue(r); break;
                                case MemberTypes.Property:
                                    o = ((PropertyInfo)m).GetValue(r); break;
                                default:
                                    continue;
                            }

                            Console.WriteLine($"-> {m.Name}:{o}");
                        }
                        continue;
                    }
                    Console.WriteLine("-> " + r);

                }
                catch (Exception e)
                {
                    Console.WriteLine(e);
                }
            }
        }
    }

    public static void Start()
    {
        Task.Run(DLoop);
    }
}